+++
title = "Create a funding rate arbitrage bot for perpetual exchanges."
description = "Learn how to create a funding rate arbitrage bot for perpetual exchanges."
date = 2025-11-07

[taxonomies]
tags = ["async", "hyperliquid", "python", "smart contracts", "blockchain"]
+++

## Introduction

Strategy that it uses
- sort and get all possible arb opportunities
- find the best one, if it exceeds the threshold, open the position
- keep the position open untill the arb is valid, 
- if you find a crazy arbitrage opportunity, switch to it
- otherwise keep the position open and wait for the next arb opportunity
- if the ROI is not enough, close the position
- watch and wait for the next arb opportunity

## Note
- I know the code is ass, it should be using some form of adapter pattern, or plugin system to support arbitrary exchanges but.
    - The integration of all exchanges in a common interface was a pain and I didn't wanna spend more time on it.
    - I was picking up one exchange then playing w it, I had the thought of having common interface but it wasn't a priority.

```python
class FundingArbBot:
    config: FundingArbBotConfig

    def __init__(self, config: FundingArbBotConfig):
        self.config = config
        self.current_arb_position = None
        self.extended = ExtendedExchange()
        self.hyperliquid = HyperliquidExchange(config=create_strategy_config_from_env())
        self.current_arb = None

    async def initialize(self):
        await self.extended.initialize()

    async def place_market_order(
        self,
        exchange: Literal[exchanges],
        market_name: str,
        side: Literal["LONG", "SHORT"],
        amount: float,
        reduce_only: bool = False,
    ) -> Optional[str]:
        if exchange == "extended":
            return await self.extended.place_market_order_retry(
                market_name, side, amount, reduce_only, self.config.slippage, 10
            )
        elif exchange == "hyperliquid":
            return self.hyperliquid.place_market_order_retry(
                market_name, side, amount, reduce_only, self.config.slippage, 10
            )
        else:
            raise ValueError(f"Unsupported exchange: {exchange}")

    async def set_leverage(
        self, exchange: Literal[exchanges], market_name: str, leverage: int
    ):
        if exchange == "extended":
            return await self.extended.set_acc_leverage(market_name, leverage)
        elif exchange == "hyperliquid":
            return self.hyperliquid.set_acc_leverage(market_name, leverage)
        else:
            raise ValueError(f"Unsupported exchange: {exchange}")

    async def get_max_leverage(
        self, exchange: Literal[exchanges], market_name: str
    ) -> int:
        if exchange == "extended":
            return await self.extended.get_max_market_leverage(market_name)
        elif exchange == "hyperliquid":
            return self.hyperliquid.get_max_market_leverage(market_name)
        else:
            raise ValueError(f"Unsupported exchange: {exchange}")

    async def get_price(
        self, exchange: Literal[exchanges], symbol: str, side: Literal["LONG", "SHORT"]
    ) -> float:
        if exchange == "extended":
            return await self.extended.get_price(symbol, side)
        elif exchange == "hyperliquid":
            return self.hyperliquid.get_price(symbol)
        else:
            raise ValueError(f"Unsupported exchange: {exchange}")

    async def get_acc_balance(self, exchange: Literal[exchanges]) -> float:
        if exchange == "extended":
            return await self.extended.get_acc_balance()
        elif exchange == "hyperliquid":
            return self.hyperliquid.get_acc_balance()
        else:
            raise ValueError(f"Unsupported exchange: {exchange}")

    async def get_qty(
        self, exchange: Literal[exchanges], symbol: str, amount: float
    ) -> float:
        if exchange == "extended":
            return await self.extended.get_qty(symbol, amount)
        elif exchange == "hyperliquid":
            return self.hyperliquid.get_qty(symbol, amount)
        else:
            raise ValueError(f"Unsupported exchange: {exchange}")

    async def get_active_position(
        self, exchange: Literal[exchanges], symbol: str
    ) -> Optional[ActivePosition]:
        """Get active position for a symbol on the specified exchange."""
        if exchange == "extended":
            return await self.extended.get_active_position(symbol)
        elif exchange == "hyperliquid":
            return self.hyperliquid.get_active_position(symbol)
        else:
            raise ValueError(f"Unsupported exchange: {exchange}")

    async def open_position(self, best_arb: Dict[str, Any], reduce_only: bool = False):
        long_exchange = None
        short_exchange = None

        if best_arb["funding_rate_ex1"] > 0:
            short_exchange = best_arb["exchange1"]
            long_exchange = best_arb["exchange2"]
        else:
            short_exchange = best_arb["exchange2"]
            long_exchange = best_arb["exchange1"]

        long_acc_balance = await self.get_acc_balance(long_exchange)
        short_acc_balance = await self.get_acc_balance(short_exchange)
        if (
            long_acc_balance < self.config.amount_usd
            or short_acc_balance < self.config.amount_usd
        ):
            error_msg = (
                f"not enough balance in LONG:{long_exchange} or SHORT:{short_exchange}"
            )
            logging.error(error_msg)
            logging.error(
                f"long balance: {long_acc_balance}, short balance: {short_acc_balance}"
            )
            send_macos_notification(
                title="Tiny HFT - Insufficient Balance",
                message=f"{error_msg}. Long: ${long_acc_balance:.2f}, Short: ${short_acc_balance:.2f}",
            )
            raise Exception(error_msg)

        # set max leverage first
        max1 = await self.get_max_leverage(long_exchange, best_arb["name"])
        max2 = await self.get_max_leverage(short_exchange, best_arb["name"])
        logging.info(
            f"max leverage for {best_arb['name']} on {long_exchange}: {max1}, on {short_exchange}: {max2}"
        )
        max_leverage = min(max1, max2)
        logging.info(
            f"setting max leverage to {max_leverage} for {best_arb['name']} on {long_exchange} and {short_exchange}"
        )
        await self.set_leverage(long_exchange, best_arb["name"], max_leverage)
        await self.set_leverage(short_exchange, best_arb["name"], max_leverage)
        logging.info(
            f"max leverage set for {best_arb['name']} on {long_exchange} and {short_exchange}"
        )

        # compute quantity
        long_price = float(
            await self.get_price(long_exchange, best_arb["name"], "LONG")
        )
        logging.info(f"current price is {long_price}")
        logging.info(f"current symbol is {best_arb['name']}")

        qty = round(self.config.amount_usd * max_leverage / long_price, 1)
        if long_price < 10:
            qty = ceil(qty)
        qty_1 = float(await self.get_qty(long_exchange, best_arb["name"], qty))
        qty_2 = float(await self.get_qty(short_exchange, best_arb["name"], qty))
        qty = float(min(qty_1, qty_2))
        self.last_qty = float(qty)

        if reduce_only:
            qty = self.last_qty

        logging.info(
            f"{"opening" if reduce_only == False else "closing"} position with qty: {qty}, value: {qty * long_price}$"
        )

        logging.info(
            f"long exchange: {long_exchange}, short exchange: {short_exchange}"
        )

        async def long_t():
            # open long position
            long_order_id = await self.place_market_order(
                long_exchange,
                best_arb["name"],
                "LONG" if reduce_only == False else "SHORT",
                qty,
                reduce_only,
            )
            if long_order_id is None:
                error_msg = f"Failed to open long position on {long_exchange}"
                logging.error(error_msg)
                send_macos_notification(
                    title="Tiny HFT - Order Failed",
                    message=f"{error_msg} for {best_arb['name']}",
                )
                raise Exception(error_msg)

        async def short_t():
            short_order_id = await self.place_market_order(
                short_exchange,
                best_arb["name"],
                "SHORT" if reduce_only == False else "LONG",
                qty,
                reduce_only,
            )
            if short_order_id is None:
                error_msg = f"Failed to open short position on {short_exchange}"
                logging.error(error_msg)
                send_macos_notification(
                    title="Tiny HFT - Order Failed",
                    message=f"{error_msg} for {best_arb['name']}",
                )
                raise Exception(error_msg)

        long_task = asyncio.create_task(long_t())
        short_task = asyncio.create_task(short_t())
        try:
            await asyncio.gather(long_task, short_task)
        except Exception as e:
            error_msg = f"Error during position {'opening' if not reduce_only else 'closing'}: {str(e)}"
            logging.error(error_msg)
            send_macos_notification(
                title="Tiny HFT - Position Error",
                message=f"{error_msg} for {best_arb['name']}",
            )
            raise

    async def close_position(self, best_arb: Dict[str, Any]):
        """Close position with the same logic as open_position but always with reduce_only=True"""
        await self.open_position(best_arb, reduce_only=True)

    def infer_positions(
        self,
        position1: ActivePosition,
        position2: ActivePosition,
        best_arb: Dict[str, Any],
    ) -> bool:
        """
        Check if positions match the best_arb by comparing symbol, size, and exchange.

        Args:
            position1: Active position from exchange1 (must not be None)
            position2: Active position from exchange2 (must not be None)
            best_arb: The best arbitrage opportunity dict (contains exchange1 and exchange2)

        Returns:
            True if positions match the best_arb, False otherwise
        """
        exchange1 = best_arb["exchange1"]
        exchange2 = best_arb["exchange2"]

        # Check if symbols match
        if position1.symbol != best_arb["name"] or position2.symbol != best_arb["name"]:
            logging.info(
                f"Symbol mismatch: positions {position1.symbol}, {position2.symbol} != {best_arb['name']}"
            )
            return False

        # Check if sizes are approximately equal (within 5% tolerance)
        size1 = position1.size
        size2 = position2.size

        if size1 == 0 or size2 == 0:
            logging.info(f"One or both positions have zero size")
            return False

        # Size should be approximately equal for arbitrage
        size_diff = abs(size1 - size2) / max(size1, size2)
        if size_diff > 0.05:  # 5% tolerance
            logging.info(f"Size mismatch: {size1} vs {size2}, diff: {size_diff:.2%}")
            return False

        logging.info(
            f"Positions match best_arb: symbol={best_arb['name']}, exchanges={exchange1}/{exchange2}, sizes={size1:.2f}/{size2:.2f}"
        )
        return True

    def filter_and_sort_arbs(self, records_df: pd.DataFrame) -> pd.DataFrame:
        """
        Filter arbitrage records by configured exchanges and sort by funding spread.

        Args:
            records_df: DataFrame containing arbitrage records

        Returns:
            Filtered and sorted DataFrame
        """
        filtered_df = records_df[
            records_df["exchange1"].isin(self.config.exchanges)
            & records_df["exchange2"].isin(self.config.exchanges)
        ]
        return filtered_df.sort_values("funding_spread", ascending=False)

    async def init_try_infer_position_or_close(self):
        """
        Try to infer existing positions at startup. If positions are found:
        - If only one position exists on one exchange, close it
        - If both positions exist and match the best arb, set current_arb
        This runs only once at startup before the main loop.
        """
        try:
            records = get_cached_arbs()
            if records is None:
                return

            records_df = pd.DataFrame(records)
            records_df_filtered = self.filter_and_sort_arbs(records_df)

            if records_df_filtered.empty:
                return

            best_arb_candidate = records_df_filtered.iloc[0]
            symbol = best_arb_candidate["name"]

            # Get positions from both exchanges
            exchange1_name = best_arb_candidate["exchange1"]
            exchange2_name = best_arb_candidate["exchange2"]
            position1 = await self.get_active_position(exchange1_name, symbol)
            position2 = await self.get_active_position(exchange2_name, symbol)

            # Handle case where position is open only on one exchange
            if position1 is not None and position2 is None:
                logging.info(f"Position found only on {exchange1_name}, closing it")
                # Use exchange-specific close method
                if exchange1_name == "hyperliquid":
                    self.hyperliquid.close_order(symbol)
                elif exchange1_name == "extended":
                    await self.extended.close_current_opened_position(
                        position1.market_name
                    )
                else:
                    logging.error(f"Unsupported exchange for closing: {exchange1_name}")
            elif position1 is None and position2 is not None:
                logging.info(f"Position found only on {exchange2_name}, closing it")
                # Use exchange-specific close method
                if exchange2_name == "hyperliquid":
                    self.hyperliquid.close_order(symbol)
                elif exchange2_name == "extended":
                    await self.extended.close_current_opened_position(
                        position2.market_name
                    )
                else:
                    logging.error(f"Unsupported exchange for closing: {exchange2_name}")
            elif position1 is not None and position2 is not None:
                # Both positions exist, check if they match best_arb
                best_arb_dict = best_arb_candidate.to_dict()
                if self.infer_positions(position1, position2, best_arb_dict):
                    logging.info(
                        f"Inferred existing position matches best_arb: {symbol}"
                    )
                    self.current_arb = best_arb_candidate
        except Exception as e:
            logging.warning(f"Error inferring positions: {e}")
            # Continue to normal flow if inference fails

    async def run(self):
        # Try to infer existing positions first (run only once at startup)
        await self.init_try_infer_position_or_close()

        while True:
            try:
                await asyncio.sleep(10)
                records = get_cached_arbs()
                if records is None:
                    logging.error("No arbs found")
                    continue

                records_df = pd.DataFrame(records)

                # if there is no current open position open at the best arb
                if self.current_arb is None:
                    # filtereed by exchanges from config
                    records_df = self.filter_and_sort_arbs(records_df)
                    if records_df.empty:
                        logging.info("no arbs found for our needed exchanges")
                        continue

                    best_arb = records_df.iloc[0]

                    yearly_roi = best_arb["funding_spread"] * 365 * 24 * 100
                    logging.info(
                        f"NEW: {best_arb['name']} with yearly roi: {yearly_roi}%"
                    )

                    if yearly_roi < self.config.min_yearly_roi:
                        logging.info(
                            f"yearly ROI {yearly_roi}% is not enough, no new position, min ROI ({self.config.min_yearly_roi}%)"
                        )
                        continue

                    await self.open_position(best_arb)
                    self.current_arb = best_arb

                # otherwise, check if the arb is still valid, if not then close the position and unset the current arb
                else:
                    last_arb = self.current_arb
                    records_df = self.filter_and_sort_arbs(records_df)
                    if records_df.empty:
                        logging.info("no arbs found for our needed exchanges")
                        continue

                    current_best_arb = records_df.iloc[0]
                    current_best_yearly_roi = (
                        current_best_arb["funding_spread"] * 365 * 24 * 100
                    )
                    logging.info(
                        f"NEW: {current_best_arb['name']} with yearly roi: {current_best_yearly_roi}%"
                    )

                    # if you find the latest best arb to cross the `switch_when` threshold, then switch to it
                    if current_best_yearly_roi > self.config.switch_when:
                        logging.info(
                            f"NEW: yearly ROI is greater than the switch when {self.config.switch_when}%, switching to the current best arb"
                        )
                        # close the current position
                        await self.close_position(current_best_arb)
                        self.current_arb = current_best_arb
                        continue

                    get_last_arb_info = records_df[
                        records_df["name"].isin([last_arb["name"]])
                        & records_df["exchange1"].isin([last_arb["exchange1"]])
                        & records_df["exchange2"].isin([last_arb["exchange2"]])
                    ]

                    if get_last_arb_info.empty:
                        logging.info("last arb is no longer valid")
                        await self.close_position(last_arb)
                        self.current_arb = None
                        continue

                    best_arb = get_last_arb_info.iloc[0]
                    yearly_roi = best_arb["funding_spread"] * 365 * 24 * 100
                    logging.info(
                        f"CURRENT: {best_arb['name']} with yearly roi: {yearly_roi}%"
                    )

                    if yearly_roi < self.config.min_yearly_roi:
                        logging.info(
                            f"CURRENT: yearly ROI i.e {self.config.min_yearly_roi}%, it too low, closing position"
                        )
                        await self.close_position(last_arb)
                        self.current_arb = None
                        continue
                    else:
                        logging.info(
                            f"CURRENT yearly ROI is still valid, currently it's {yearly_roi}%"
                        )
            except Exception as e:
                error_message = str(e)
                logging.error(f"Error in run: {error_message}")
                send_macos_notification(
                    title="Tiny HFT - Bot Error",
                    message=f"Funding arb bot error: {error_message}",
                )
                raise e


# gunicorn --bind 0.0.0.0:8001 --workers 1 --threads 4 --worker-class sync strategies.funding_arb:app --reload
async def main():
    # Pre-populate cache on startup
    update_combined_rates_cache()
    update_arbs_cache()
    print("pre-populated cache")
    config = FundingArbBotConfig(
        exchanges=["hyperliquid", "extended"],
        amount_usd=100,
        slippage=0.01,
        min_yearly_roi=200,
        switch_when=1500,
    )

    logging.info(f"Config variables:")
    logging.info(f"exchanges: {', '.join(config.exchanges)}")
    logging.info(f"amount_usd: {config.amount_usd}$")
    logging.info(f"slippage: {config.slippage*100}%")
    logging.info(f"min_yearly_roi: {config.min_yearly_roi}%")
    logging.info(f"switch_when: {config.switch_when}%")

    bot = FundingArbBot(config=config)
    await bot.initialize()
    send_macos_notification(
        title="Tiny HFT - Bot Started",
        message=f"Funding arb bot has started successfully. Exchanges: {', '.join(config.exchanges)}",
    )
    await bot.run()


if __name__ == "__main__":
    asyncio.run(main())

```



### Some cache related stuff

It computes the arbitrage opportunities and caches them for 1 minute.

```python
FUNDING_FETCHER: Dict[Literal[exchanges], Callable] = {
    "extended": get_markets_info_from_extended,
    "hibachi": get_markets_info_from_hibachi,
    "hyperliquid": get_markets_info_from_hyperliquid,
    "lighter": get_markets_info_from_lighter,
    "pacifica": get_markets_info_from_pacifica,
    # "variational": get_markets_info_from_variational,
}


app = Flask(
    __name__, template_folder=os.path.join(os.path.dirname(__file__), "templates")
)

# Cache configuration
CACHE_TTL_SECONDS = 1 * 60
cache_lock = threading.Lock()
data_cache = {
    "combined_rates": {
        "data": None,
        "timestamp": 0,
        "updating": False,
    },
    "arbs": {
        "data": None,
        "timestamp": 0,
        "updating": False,
    },
}


def convert_nan_to_none(value):
    """Convert NaN values to None for JSON serialization"""
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        # If pd.isna fails, just return the value as-is
        pass
    return value


def is_cache_stale(cache_entry: Dict[str, Any]) -> bool:
    """Check if cache entry is stale (older than TTL)"""
    if cache_entry["data"] is None:
        return True
    age = time.time() - cache_entry["timestamp"]
    return age >= CACHE_TTL_SECONDS


def update_combined_rates_cache():
    """Update the combined rates cache"""
    try:
        df = combined_funding_rates()
        if df.empty:
            records = []
        else:
            # Convert DataFrame to JSON (orient='records' gives a list of dictionaries)
            records = df.to_dict(orient="records")
            # Replace NaN values with None for JSON serialization
            records = [
                {k: convert_nan_to_none(v) for k, v in record.items()}
                for record in records
            ]

        with cache_lock:
            cache_entry = data_cache["combined_rates"]
            cache_entry["data"] = records
            cache_entry["timestamp"] = time.time()
            cache_entry["updating"] = False
    except Exception as e:
        import logging
        import traceback

        logging.error(f"Error updating combined_rates cache: {e}")
        logging.error(traceback.format_exc())


def update_arbs_cache():
    """Update the arbitrage opportunities cache"""
    try:
        df = get_arbs_df()
        if df.empty:
            records = []
        else:
            # Convert DataFrame to JSON (orient='records' gives a list of dictionaries)
            records = df.to_dict(orient="records")
            # Replace NaN values with None for JSON serialization
            records = [
                {k: convert_nan_to_none(v) for k, v in record.items()}
                for record in records
            ]

        with cache_lock:
            cache_entry = data_cache["arbs"]
            cache_entry["data"] = records
            cache_entry["timestamp"] = time.time()
            cache_entry["updating"] = False
    except Exception as e:
        import logging
        import traceback

        logging.error(f"Error updating arbs cache: {e}")
        logging.error(traceback.format_exc())


def get_cached_combined_rates():
    """Get combined rates from cache, updating if stale"""
    thread = None
    with cache_lock:
        cache_entry = data_cache["combined_rates"]
        stale = is_cache_stale(cache_entry)
        updating = cache_entry["updating"]
        old_data = cache_entry["data"]

        if stale and not updating:
            # Mark as updating and start background thread
            cache_entry["updating"] = True
            thread = threading.Thread(target=update_combined_rates_cache, daemon=True)
            thread.start()
            # Return old data if available, while update happens in background
            if old_data is not None:
                return old_data

    # If we get here, either cache is fresh or we're waiting for initial data
    if stale and old_data is None and thread is not None:
        # Wait for initial data from thread we just started
        thread.join()
        with cache_lock:
            return data_cache["combined_rates"]["data"]
    elif stale and old_data is None:
        # Another thread is updating, wait a bit and retry
        time.sleep(0.1)
        with cache_lock:
            return data_cache["combined_rates"]["data"]
    elif not stale:
        return old_data
    else:
        # Cache is updating, return old data if available
        return old_data


def get_cached_arbs():
    """Get arbitrage opportunities from cache, updating if stale"""
    thread = None
    with cache_lock:
        cache_entry = data_cache["arbs"]
        stale = is_cache_stale(cache_entry)
        updating = cache_entry["updating"]
        old_data = cache_entry["data"]

        if stale and not updating:
            # Mark as updating and start background thread
            cache_entry["updating"] = True
            thread = threading.Thread(target=update_arbs_cache, daemon=True)
            thread.start()
            # Return old data if available, while update happens in background
            if old_data is not None:
                return old_data

    # If we get here, either cache is fresh or we're waiting for initial data
    if stale and old_data is None and thread is not None:
        # Wait for initial data from thread we just started
        thread.join()
        with cache_lock:
            return data_cache["arbs"]["data"]
    elif stale and old_data is None:
        # Another thread is updating, wait a bit and retry
        time.sleep(0.1)
        with cache_lock:
            return data_cache["arbs"]["data"]
    elif not stale:
        return old_data
    else:
        # Cache is updating, return old data if available
        return old_data
```