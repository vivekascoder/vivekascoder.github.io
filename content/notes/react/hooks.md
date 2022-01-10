---
title: "Different Hooks in React"
---

## useReducer
When you want to handle much complex state then you should use useReducer
instead of useState.
```js
import { useReducer } from "react";

const reducer = (state, action) => {
  console.log(action);
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "DECREMENT":
      return { count: state.count - 1 };
    default:
      return state;
  }
};

export default function Home() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  const increment = () => {
    dispatch({ type: "INCREMENT", foo: "bar" });
  };
  const decrement = () => {
    dispatch({ type: "DECREMENT" });
  };

  return (
    <div>
      <h1>Hello World</h1>
      <div style={divStyle}>
        <button onClick={decrement}>-</button>
        <p style={{ display: "inline-block", padding: "10px" }}>
          {state.count}
        </p>
        <button onClick={increment}>+</button>
      </div>
    </div>
  );
}

const divStyle = {
  display: "flex",
};
```

## useMemo
For caching a function

```js
import { useEffect, useState } from "react";
import { useMemo } from "react";

export default function Home() {
  const [number, setNumber] = useState(0);
  const [dark, setDark] = useState(false);
  const doubleNumber = useMemo(() => {
    return slowFunction(number);
  }, [number]);

  const themeStyles = useMemo(() => {
    return {
      paddind: "12px",
      background: dark ? "#333" : "#fff",
      color: !dark ? "#333" : "#fff",
    };
  }, [themeStyles]);

  useEffect(() => {
    console.log("themeStyles changed.");
    // It will be printed even if the themeStyles is not changed.
    // because of referential inequality in js i.e {foo: "bar"} != {foo: "bar"}
    // In order to fix it you need to memoize the themeStyles state.
  }, [themeStyles]);

  return (
    <>
      <input
        type="number"
        value={number}
        onChange={(e) => {
          setNumber(e.target.value);
        }}
      />
      <button onClick={() => setDark((dark) => !dark)}>
        {dark ? "🌕 Light" : "🌒 Dark"}
      </button>
      <div style={themeStyles}>
        <h1>{doubleNumber}</h1>
      </div>
    </>
  );
}

const slowFunction = (number) => {
  console.log("Calling slow function.");
  for (let i = 0; i < 1000000000; i++) {}
  return number * 2;
};

```
