+++
title = "Run a scalping bot that uses bollinger bands and RSI to trade."
description = "Learn how to run a scalping bot that uses bollinger bands and RSI to trade."
date = 2025-11-07

[taxonomies]
tags = ["async", "lighter", "python", "smart contracts", "blockchain"]
+++

## Introduction

Run scalping bot that uses bollinger bands and RSI to trade.

```python
class BollingerBandsBot:
    exchange: LighterExchange
    running = False  # Class variable to control producer/consumer loops

    def __init__(
        self,
        exchange: LighterExchange,
        config: BBLighterConfig,
    ):
        self.exchange = exchange
        self.config = config
        self.symbol = (
            self.config.market_name.upper()
        )  # Lighter uses uppercase symbols directly

        # Position state - track via MarketPosition from user_events_queue
        self.position_lock = asyncio.Lock()
        self.last_active_position: None | MarketPosition = None

        # Add streaming DataFrame for incremental candle updates
        self.ohlcv_stream = pd.DataFrame()
        self.max_candles = 100  # Keep enough candles for indicator calculations

        self.skip_candle: None | int = None
        self.skip_candle_lock = asyncio.Lock()

        self.price_cooldown = True
        self.last_closed_position_side: None | Literal["LONG", "SHORT"] = None

    def _get_candle_interval_ms(self) -> int:
        """Get candle interval duration in milliseconds based on config."""
        candle_in_sec = None
        match self.config.candle_interval:
            case "1m":
                candle_in_sec = 60
            case "5m":
                candle_in_sec = 300
            case "15m":
                candle_in_sec = 900
            case "1h":
                candle_in_sec = 3600
            case "4h":
                candle_in_sec = 14400
            case "1d":
                candle_in_sec = 86400
            case "1w":
                candle_in_sec = 604800
            case _:
                raise ValueError(
                    f"Invalid candle interval: {self.config.candle_interval}"
                )
        return candle_in_sec * 1000  # Convert to milliseconds

    def _compute_nearest_candle_time(self, timestamp_ms: int) -> int:
        """Compute the nearest candle timestamp (in ms) by rounding down to candle boundary."""
        interval_ms = self._get_candle_interval_ms()
        return (timestamp_ms // interval_ms) * interval_ms

    def _check_price_cooldown(
        self,
        mid_price: float,
        _last_upper_band: float,
        _last_lower_band: float,
        last_middle_band: float,
    ):
        """Check if price cooldown should be reset based on price position relative to Bollinger Bands."""
        side = None
        if self.last_active_position:
            side = self.exchange.get_sign(self.last_active_position)
        else:
            side = self.last_closed_position_side

        if self.price_cooldown == False:
            if side == "LONG":
                if mid_price > last_middle_band:
                    logging.info(f"price cooldown: LONG, price above middle band")
                    self.price_cooldown = True
            elif side == "SHORT":
                if mid_price < last_middle_band:
                    logging.info(f"price cooldown: SHORT, price below middle band")
                    self.price_cooldown = True
            # else:
            #     # this is the case when there is no position (starting, or after calling reduce_position)
            #     # in starting price_cooldown is True so the only case it can happen is reduce_position is called
            #     self.last_closed_position_side

    async def initialize(self):
        """Initialize streaming DataFrame with historical candles and LighterExchange WebSocket"""
        # Initialize LighterExchange WebSocket
        asyncio.create_task(self.exchange.initialize(self.symbol))

        # Fetch initial historical data (one-time API call)
        candle_in_sec = None
        match self.config.candle_interval:
            case "1m":
                candle_in_sec = 60
            case "5m":
                candle_in_sec = 300
            case "15m":
                candle_in_sec = 900
            case "1h":
                candle_in_sec = 3600
            case "4h":
                candle_in_sec = 14400
            case "1d":
                candle_in_sec = 86400
            case "1w":
                candle_in_sec = 604800
            case _:
                raise ValueError(
                    f"Invalid candle interval: {self.config.candle_interval}"
                )
        start_time = int(datetime.now().timestamp() - candle_in_sec * self.max_candles)

        self.ohlcv_stream = await self.exchange.get_ohlcv_data(
            market_name=self.symbol,
            interval=self.config.candle_interval,
            start_time=start_time * 1000,
            end_time=int(datetime.now().timestamp() * 1000),
        )
        logging.info(
            f"Initialized streaming DataFrame with {len(self.ohlcv_stream)} historical candles"
        )

    async def producer(self, queue: asyncio.Queue):
        """Fetch last 50 OHLCV records from LighterExchange every 2 seconds, replace ohlcv_stream, and trigger consumer"""
        while self.running:
            try:
                # Wait 2 seconds at the beginning of each iteration
                await asyncio.sleep(2)

                # Fetch last 50 OHLCV records every 2 seconds
                end_time = int(datetime.now().timestamp() * 1000)
                # Use a wide enough time range, but count_back=50 in lighter.py will limit to 50 records
                start_time = end_time - (
                    86400 * 1000
                )  # Last 24 hours (enough range, count_back limits to 50)

                ohlcv_data = await self.exchange.get_ohlcv_data(
                    market_name=self.symbol,
                    interval=self.config.candle_interval,
                    start_time=start_time,
                    end_time=end_time,
                    count_back=50,
                )

                if len(ohlcv_data) == 0:
                    continue

                # Replace ohlcv_stream with the fetched data (last 50 records)
                self.ohlcv_stream = ohlcv_data.tail(50).copy()

                # Get the latest candle to trigger consumer
                latest_candle = ohlcv_data.iloc[-1]

                # Get the timestamp from the index
                timestamp = latest_candle.name
                timestamp_ms = int(timestamp.timestamp() * 1000)

                # Convert to expected format
                candle_data = {
                    "open": float(latest_candle["Open"]),
                    "high": float(latest_candle["High"]),
                    "low": float(latest_candle["Low"]),
                    "close": float(latest_candle["Close"]),
                    "volume": float(latest_candle["Volume"]),
                    "timestamp": timestamp_ms,
                }

                # Convert Unix timestamp to human-readable format
                readable_timestamp = datetime.fromtimestamp(
                    timestamp_ms / 1000, tz=self.config.get_timezone()
                ).strftime("%Y-%m-%d %I:%M:%S %p")
                logging.debug(
                    f"producer: fetched {len(ohlcv_data)} candles, latest: {readable_timestamp}"
                )

                # Trigger consumer with latest candle
                logging.debug(
                    f"producer: triggering consumer with latest candle: {readable_timestamp}"
                )
                await queue.put(candle_data)

            except Exception as e:
                logging.error(f"Error in producer: {e}", exc_info=True)
                await asyncio.sleep(2)

    async def consumer(self, queue: asyncio.Queue):
        """
        Consumer that spawns a new asyncio task for each message processing.
        """
        active_tasks = set()  # Track active tasks

        while self.running:
            try:
                item = await queue.get()

                # Create a new asyncio task for each message
                task = asyncio.create_task(
                    self.process_message_async(item),
                    name=f"consumer: <{generate_alphanumeric_id()}>",
                )

                # Add task to active set
                active_tasks.add(task)

                # Remove task from set when it completes
                task.add_done_callback(active_tasks.discard)

                queue.task_done()

            except Exception as e:
                logging.error(f"Error in consumer: {e}")
                queue.task_done()

        # Wait for all active tasks to complete before exiting
        if active_tasks:
            await asyncio.gather(*active_tasks, return_exceptions=True)

    # @measure_time(strategy_name="bb_lighter_process_message_async")
    async def process_message_async(self, item):
        """
        Async version of message processing that runs in the main event loop.
        This function handles the actual trading logic.
        """
        try:
            # Get current task info for logging
            current_task = asyncio.current_task()
            task_name = current_task.get_name() if current_task else "Unknown"

            # Convert Unix timestamp to human-readable format
            readable_timestamp = datetime.fromtimestamp(
                item["timestamp"] / 1000, tz=self.config.get_timezone()
            ).strftime("%Y-%m-%d %I:%M:%S %p")

            # ohlcv_stream is already updated by producer every 2 seconds
            # Just use the current streaming data
            last_ohlv_data = self.ohlcv_stream

            # Ensure we have enough data for indicators
            if len(last_ohlv_data) < 20:
                logging.warning(
                    f"Insufficient OHLCV data: {len(last_ohlv_data)} candles. Need at least 20 for indicators."
                )
                return

            async with self.position_lock:

                if (
                    self.skip_candle is not None
                    and self.skip_candle >= item["timestamp"]
                ):
                    logging.trace(
                        f"skipping candle {readable_timestamp}",
                        extra={
                            "skip_candle": self.skip_candle,
                            "klines_msg": item["timestamp"],
                        },
                    )
                    return

                mid_price = await self.exchange.get_price(self.symbol)

                best_bid_price = mid_price
                best_ask_price = mid_price

                logging.debug(
                    f"{task_name} best bid price: {best_bid_price}, best ask price: {best_ask_price}"
                )

                upper_band, middle_band, lower_band = talib.BBANDS(
                    last_ohlv_data["Close"],
                    timeperiod=self.config.bbands_period,
                    nbdevup=self.config.bbands_devup,
                    nbdevdn=self.config.bbands_devdn,
                )
                rsi = talib.RSI(
                    last_ohlv_data["Close"], timeperiod=self.config.rsi_period
                )
                atr = talib.ATR(
                    last_ohlv_data["High"],
                    last_ohlv_data["Low"],
                    last_ohlv_data["Close"],
                    timeperiod=self.config.atr_period,
                )
                atr_multiplier = self.config.atr_multiplier

                # Extract last values to avoid repeated .iloc[-1] calls
                last_atr = atr.iloc[-1]
                # last_close = last_ohlv_data["Close"].iloc[-1]
                last_lower_band = lower_band.iloc[-1]
                last_upper_band = upper_band.iloc[-1]
                last_middle_band = middle_band.iloc[-1]
                last_rsi = rsi.iloc[-1]

                # # Log Bollinger Band conditions
                # if mid_price > last_upper_band:
                #     logging.info(
                #         f"Last traded price ({mid_price:.4f}) is ABOVE Bollinger Band upper ({last_upper_band:.4f})"
                #     )
                # elif mid_price < last_lower_band:
                #     logging.info(
                #         f"Last traded price ({mid_price:.4f}) is BELOW Bollinger Band lower ({last_lower_band:.4f})"
                #     )

                # Check if price is close to middle band (within 0.5%)
                middle_band_diff_percent = (
                    abs(mid_price - last_middle_band) / last_middle_band
                )
                # if middle_band_diff_percent <= 0.005:  # 0.5% threshold
                #     logging.info(
                #         f"Last traded price ({mid_price:.4f}) is CLOSE to Bollinger Band middle ({last_middle_band:.4f}), "
                #         f"diff: {middle_band_diff_percent*100:.2f}%"
                #     )

                # Check if price cooldown is needed
                self._check_price_cooldown(
                    mid_price, last_upper_band, last_lower_band, last_middle_band
                )

                # Calculate TP/SL based on tp_sl_ratio and ATR
                tp_distance = self.config.tp_sl_ratio * last_atr * atr_multiplier
                sl_distance = last_atr * atr_multiplier

                tpsl_dynamic_atr = {
                    "long": {
                        "tp": best_ask_price + tp_distance,
                        "sl": best_ask_price - sl_distance,
                    },
                    "short": {
                        "tp": best_bid_price - tp_distance,
                        "sl": best_bid_price + sl_distance,
                    },
                }

                go_long = (
                    best_ask_price < last_lower_band
                    and last_rsi < 45
                    and self.price_cooldown
                )
                go_short = (
                    best_bid_price > last_upper_band
                    and last_rsi > 55
                    and self.price_cooldown
                )

                # # Check current position state from MarketPosition
                # current_position_size = 0.0
                # current_position_side = None
                # if (
                #     self.last_active_position
                #     and self.last_active_position.symbol.upper() == self.symbol
                # ):
                #     current_position_size = float(self.last_active_position.position)
                #     # sign == -1 for short, otherwise long
                #     current_position_side = (
                #         "short" if self.last_active_position.sign == -1 else "long"
                #     )

                close_long_position = best_bid_price > last_middle_band
                close_short_position = best_ask_price < last_middle_band

                if self.last_active_position:
                    if (
                        self.exchange.get_sign(self.last_active_position) == "LONG"
                        and close_long_position
                    ):
                        try:
                            await self.exchange.reduce_position(
                                symbol=self.symbol,
                                side="SHORT",
                                quantity=float(self.last_active_position.position),
                            )
                            self.last_active_position = None
                            self.last_closed_position_side = "LONG"
                            logging.info(
                                f"{task_name} closed long position via reduce_position"
                            )
                        except Exception as e:
                            logging.error(
                                f"{task_name} Error closing long position: {e}",
                                exc_info=True,
                            )

                    if (
                        self.exchange.get_sign(self.last_active_position) == "SHORT"
                        and close_short_position
                    ):
                        try:
                            await self.exchange.reduce_position(
                                symbol=self.symbol,
                                side="LONG",
                                quantity=float(self.last_active_position.position),
                            )
                            self.last_active_position = None
                            self.last_closed_position_side = "SHORT"
                            logging.info(
                                f"{task_name} closed short position via reduce_position"
                            )
                        except Exception as e:
                            logging.error(
                                f"{task_name} Error closing short position: {e}",
                                exc_info=True,
                            )

                # if float(current_position_size) == 0:
                #     return

                if go_long:
                    # close current short position if exists
                    if (
                        self.last_active_position == None
                        or self.exchange.get_sign(self.last_active_position) == "SHORT"
                        or self.last_active_position.position == 0
                    ):
                        if (
                            self.last_active_position
                            and float(self.last_active_position.position) > 0
                        ):
                            try:
                                await self.exchange.reduce_position(
                                    symbol=self.symbol,
                                    side="LONG",
                                    quantity=float(self.last_active_position.position),
                                )
                            except Exception as e:
                                logging.error(
                                    f"{task_name} Error closing short position: {e}",
                                    exc_info=True,
                                )

                        try:
                            await self.exchange.open_position(
                                symbol=self.symbol,
                                side="LONG",
                                quantity=float(self.config.trade_size),
                                tp_price=tpsl_dynamic_atr["long"]["tp"],
                                sl_price=tpsl_dynamic_atr["long"]["sl"],
                            )
                            self.price_cooldown = False
                            # Set skip_candle to last candle timestamp
                            async with self.skip_candle_lock:
                                self.skip_candle = item["timestamp"]
                            logging.info(f"{task_name} opened long position")
                        except Exception as e:
                            logging.error(
                                f"{task_name} failed to open long position: {e}",
                                exc_info=True,
                            )

                if go_short:
                    # close current long position if exists
                    if (
                        self.last_active_position == None
                        or self.last_active_position.side == "long"
                        or self.last_active_position.position == 0
                    ):
                        if (
                            self.last_active_position
                            and float(self.last_active_position.position) > 0
                        ):
                            try:
                                await self.exchange.reduce_position(
                                    symbol=self.symbol,
                                    side="SHORT",
                                    quantity=float(self.last_active_position.position),
                                )
                            except Exception as e:
                                logging.error(
                                    f"{task_name} Error closing long position: {e}",
                                    exc_info=True,
                                )

                    try:
                        await self.exchange.open_position(
                            symbol=self.symbol,
                            side="SHORT",
                            quantity=float(self.config.trade_size),
                            tp_price=tpsl_dynamic_atr["short"]["tp"],
                            sl_price=tpsl_dynamic_atr["short"]["sl"],
                        )
                        self.price_cooldown = False
                        # Set skip_candle to last candle timestamp
                        async with self.skip_candle_lock:
                            self.skip_candle = item["timestamp"]
                        logging.info(f"{task_name} opened short position")
                    except Exception as e:
                        logging.error(
                            f"{task_name} failed to open short position: {e}",
                            exc_info=True,
                        )

        except Exception as e:
            logging.error(f"Error in consumer thread: {e}", exc_info=True)
            # raise e

    async def strategy(self):
        logging.info("Starting strategy initialization")
        # Note: LighterExchange doesn't have close_order, positions are managed via MarketPosition
        queue = asyncio.Queue()
        self.running = True

        producer_task = asyncio.create_task(self.producer(queue))
        consumer_task = asyncio.create_task(self.consumer(queue))
        process_user_events_task = asyncio.create_task(self.process_user_events())

        try:
            await asyncio.gather(producer_task, consumer_task, process_user_events_task)
        except KeyboardInterrupt:
            logging.info("Stopping strategy...")
            self.running = False
            await producer_task
            await consumer_task
            await process_user_events_task

    async def process_user_events(self):
        """Listen to MarketPosition updates from LighterExchange user_events_queue"""
        while self.running:
            try:
                market_position_event: MarketPosition = await asyncio.wait_for(
                    self.exchange.user_events_queue.get(), timeout=0.1
                )

                # Only process positions for our symbol
                if market_position_event.symbol.upper() != self.symbol:
                    continue

                position_value = float(market_position_event.position)

                async with self.position_lock:
                    # Get previous position state before updating
                    previous_position_value = 0.0
                    previous_position_sign = None
                    if self.last_active_position:
                        previous_position_value = float(
                            self.last_active_position.position
                        )
                        previous_position_sign = self.last_active_position.sign

                    # Update current position state
                    # self.last_active_position = market_positio_eventn

                    # When position becomes 0, it means position was closed (TP/SL triggered)
                    if position_value == 0.0:
                        if previous_position_value != 0.0:
                            side = "short" if previous_position_sign == -1 else "long"
                            self.last_closed_position_side = side.upper()
                            logging.info(
                                f"TP/SL: position closed | previous {side} size: @{abs(previous_position_value)}"
                            )
                            self.last_active_position = None
                        else:
                            logging.trace("no open position")
                            # Set current_position to None since there's no position
                    else:
                        # sign == -1 for short, otherwise long
                        side = "short" if market_position_event.sign == -1 else "long"
                        logging.info(
                            f"position update | {side} size: @{abs(position_value)}"
                        )
                        self.last_active_position = market_position_event

            except asyncio.TimeoutError:
                # No event available, continue polling
                continue
            except Exception as e:
                logging.error(f"Error in process_user_events: {e}", exc_info=True)
                await asyncio.sleep(0.1)


async def main():
    load_dotenv()
    # Load config from JSON file
    config = load_bb_lighter_config()
    logging.info("Starting strategy...")
    exchange = LighterExchange()

    sma_crossover = BollingerBandsBot(
        exchange,
        config,
    )
    await sma_crossover.initialize()
    await sma_crossover.strategy()


if __name__ == "__main__":
    asyncio.run(main=main())

```