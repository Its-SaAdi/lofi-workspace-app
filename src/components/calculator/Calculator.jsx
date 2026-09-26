import { useCallback, useEffect, useMemo, useState } from "react";

const OPERATORS = ["+", "-", "*", "/", "^"];

const isOperator = (value) => OPERATORS.includes(value);
const isDigit = (value) => /[0-9]/.test(value);

const formatResult = (value) => {
    if (!Number.isFinite(value)) {
        throw new Error("Math error");
    }

    if (Object.is(value, -0)) {
        return "0";
    }

    const rounded = Number.parseFloat(value.toPrecision(12));

    return String(rounded);
};

const factorial = (value) => {
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        throw new Error("Invalid factorial");
    }

    if (value > 170) {
        throw new Error("Number too large");
    }

    let result = 1;

    for (let i = 2; i <= value; i++) {
        result *= i;
    }

    return result;
};

/*
 * Small recursive-descent expression parser.
 *
 * Supported:
 * + - * / ^
 * parentheses
 * sin cos tan
 * asin acos atan
 * ln log
 * sqrt
 * factorial
 * pi
 * e
 * percentage
 */
const evaluateExpression = (expression, angleMode = "DEG") => {
    let index = 0;

    const input = expression
        .replace(/\s+/g, "")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, "pi");

    const peek = () => input[index];

    const consume = (character) => {
        if (input[index] === character) {
            index++;
            return true;
        }

        return false;
    };

    const parseNumber = () => {
        const start = index;

        while (/[0-9.]/.test(input[index] || "")) {
            index++;
        }

        const value = Number(input.slice(start, index));

        if (Number.isNaN(value)) {
            throw new Error("Invalid number");
        }

        return value;
    };

    const parseIdentifier = () => {
        const start = index;

        while (/[a-zA-Z]/.test(input[index] || "")) {
            index++;
        }

        return input.slice(start, index).toLowerCase();
    };

    const toRadians = (value) =>
        angleMode === "DEG"
            ? (value * Math.PI) / 180
            : value;

    const fromRadians = (value) =>
        angleMode === "DEG"
            ? (value * 180) / Math.PI
            : value;

    const applyFunction = (name, value) => {
        switch (name) {
            case "sin":
                return Math.sin(toRadians(value));

            case "cos":
                return Math.cos(toRadians(value));

            case "tan":
                return Math.tan(toRadians(value));

            case "asin":
                return fromRadians(Math.asin(value));

            case "acos":
                return fromRadians(Math.acos(value));

            case "atan":
                return fromRadians(Math.atan(value));

            case "ln":
                return Math.log(value);

            case "log":
                return Math.log10(value);

            case "sqrt":
                return Math.sqrt(value);

            case "abs":
                return Math.abs(value);

            default:
                throw new Error(`Unknown function: ${name}`);
        }
    };

    const parsePrimary = () => {
        if (consume("(")) {
            const value = parseAdditive();

            if (!consume(")")) {
                throw new Error("Missing )");
            }

            return value;
        }

        if (/[0-9.]/.test(peek() || "")) {
            return parseNumber();
        }

        if (/[a-zA-Z]/.test(peek() || "")) {
            const identifier = parseIdentifier();

            if (identifier === "pi") {
                return Math.PI;
            }

            if (identifier === "e") {
                return Math.E;
            }

            if (!consume("(")) {
                throw new Error("Expected (");
            }

            const value = parseAdditive();

            if (!consume(")")) {
                throw new Error("Missing )");
            }

            return applyFunction(identifier, value);
        }

        throw new Error("Invalid expression");
    };

    const parsePostfix = () => {
        let value = parsePrimary();

        while (true) {
            if (consume("!")) {
                value = factorial(value);
                continue;
            }

            if (consume("%")) {
                value /= 100;
                continue;
            }

            break;
        }

        return value;
    };

    const parseUnary = () => {
        if (consume("+")) {
            return parseUnary();
        }

        if (consume("-")) {
            return -parseUnary();
        }

        return parsePostfix();
    };

    const parsePower = () => {
        const left = parseUnary();

        if (consume("^")) {
            const right = parsePower();
            return Math.pow(left, right);
        }

        return left;
    };

    const parseMultiplicative = () => {
        let value = parsePower();

        while (true) {
            if (consume("*")) {
                value *= parsePower();
            } else if (consume("/")) {
                const divisor = parsePower();

                if (divisor === 0) {
                    throw new Error("Cannot divide by zero");
                }

                value /= divisor;
            } else {
                break;
            }
        }

        return value;
    };

    const parseAdditive = () => {
        let value = parseMultiplicative();

        while (true) {
            if (consume("+")) {
                value += parseMultiplicative();
            } else if (consume("-")) {
                value -= parseMultiplicative();
            } else {
                break;
            }
        }

        return value;
    };

    if (!input) {
        throw new Error("Empty expression");
    }

    const result = parseAdditive();

    if (index < input.length) {
        throw new Error("Invalid expression");
    }

    return result;
};

const Calculator = () => {
    // 3 imp piece of data
    const [expression, setExpression] = useState("");
    const [display, setDisplay] = useState("0");
    const [mode, setMode] = useState("basic");

    const [angleMode, setAngleMode] = useState("DEG");
    const [justCalculated, setJustCalculated] = useState(false);
    const [error, setError] = useState(false);

    const scientific = mode === "scientific";

    const clear = useCallback(() => {
        setExpression("");
        setDisplay("0");
        setError(false);
        setJustCalculated(false);
    }, []);

    const backspace = useCallback(() => {
        if (error || justCalculated) {
            clear();
            return;
        }

        setExpression((current) => current.slice(0, -1));
        setDisplay((current) => {
            if (current.length <= 1) return "0";
            return current.slice(0, -1);
        });
    }, [clear, error, justCalculated]);

    const calculate = useCallback(() => {
        if (!expression) return;

        try {
            const result = evaluateExpression(expression, angleMode);
            const formatted = formatResult(result);

            setDisplay(formatted);
            // setExpression(formatted);
            setError(false);
            setJustCalculated(true);
        } catch {
            setDisplay("Error");
            setError(true);
            setJustCalculated(false);
        }
    }, [angleMode, expression]);

    const appendValue = useCallback(
        (value) => {
            setError(false);

            if (justCalculated) {
                if (
                    isDigit(value) ||
                    value === "." ||
                    value === "("
                ) {
                    setExpression(value);
                    setDisplay(value);
                    setJustCalculated(false);
                    return;
                }

                setJustCalculated(false);
            }

            setExpression((current) => {
                const next = current + value;
                setDisplay(next);
                return next;
            });
        },
        [justCalculated]
    );

    const appendOperator = useCallback(
        (operator) => {
            setError(false);

            if (justCalculated) {
                const updated = `${display}${operator}`;

                setExpression(updated)
                setDisplay(display)
                setJustCalculated(false);

                return
            }

            setExpression((current) => {
                if (!current) {
                    if (operator === "-") {
                        setDisplay("-");
                        return "-";
                    }

                    return current;
                }

                if (isOperator(current.at(-1))) {
                    const updated = current.slice(0, -1) + operator;
                    setDisplay(updated);
                    return updated;
                }

                const updated = current + operator;
                setDisplay(updated);
                return updated;
            });
        },
        [display, justCalculated]
    );

    const toggleSign = useCallback(() => {
        if (!expression || error) return;

        try {
            const value = evaluateExpression(expression, angleMode);
            const updated = formatResult(-value);

            setExpression(updated);
            setDisplay(updated);
            setJustCalculated(true);
        } catch {
            // Ignore invalid expressions.
        }
    }, [angleMode, error, expression]);

    const addFunction = useCallback(
        (name) => {
            setError(false);

            if (justCalculated) {
                const updated = `${name}(${display})`;
                
                setExpression(updated);
                setDisplay(updated);
                setJustCalculated(false);
                return;
            }

            const value = `${name}(`;

            setExpression((current) => {
                const updated = current + value;
                setDisplay(updated);
                return updated;
            });
        },
        [display, justCalculated]
    );

    const addConstant = useCallback(
        (constant) => {
            setError(false);

            if (justCalculated) {
                setExpression(constant);
                setDisplay(constant);
                setJustCalculated(false);
                return;
            }

            setExpression((current) => {
                const updated = current + constant;
                setDisplay(updated);
                return updated;
            });
        },
        [justCalculated]
    );

    const toggleMode = () => {
        setMode((current) =>
            current === "basic" ? "scientific" : "basic"
        );
    };

    useEffect(() => {
        const handleKeyboard = (event) => {
            const key = event.key;

            if (/^[0-9]$/.test(key)) {
                event.preventDefault();
                appendValue(key);
                return;
            }

            if (key === ".") {
                event.preventDefault();
                appendValue(".");
                return;
            }

            if (["+", "-", "*", "/", "^"].includes(key)) {
                event.preventDefault();
                appendOperator(key);
                return;
            }

            if (key === "Enter" || key === "=") {
                event.preventDefault();
                calculate();
                return;
            }

            if (key === "Backspace") {
                event.preventDefault();
                backspace();
                return;
            }

            if (key === "Escape" || key === "Delete") {
                event.preventDefault();
                clear();
                return;
            }

            if (key === "(" || key === ")") {
                event.preventDefault();
                appendValue(key);
                return;
            }

            if (key === "%") {
                event.preventDefault();
                appendValue("%");
                return;
            }

            if (!scientific) return;

            const scientificKeys = {
                s: "sin",
                c: "cos",
                t: "tan",
                l: "ln",
                r: "sqrt",
            };

            const functionName = scientificKeys[key.toLowerCase()];

            if (functionName) {
                event.preventDefault();
                addFunction(functionName);
            }

            if (key.toLowerCase() === "p") {
                event.preventDefault();
                addConstant("pi");
            }

            if (key.toLowerCase() === "e") {
                event.preventDefault();
                addConstant("e");
            }

            if (key === "!") {
                event.preventDefault();
                appendValue("!");
            }
        };

        window.addEventListener("keydown", handleKeyboard);

        return () => {
            window.removeEventListener("keydown", handleKeyboard);
        };
    }, [
        addConstant,
        addFunction,
        appendOperator,
        appendValue,
        backspace,
        calculate,
        clear,
        scientific,
    ]);

    const basicButtons = useMemo(
        () => [
            ["AC", "backspace", "(", ")"],
            ["7", "8", "9", "÷"],
            ["4", "5", "6", "×"],
            ["1", "2", "3", "-"],
            ["0", ".", "%", "+"],
        ],
        []
    );

    const scientificButtons = [
        ["sin", "cos", "tan", "√"],
        ["ln", "log", "π", "e"],
        ["x²", "xʸ", "x!", "1/x"],
    ];

    const handleButton = (value) => {
        if (value === "AC") {
            clear();
            return;
        }

        if (value === "backspace") {
            backspace();
            return;
        }

        if (value === "=") {
            calculate();
            return;
        }

        if (value === "±") {
            toggleSign();
            return;
        }

        if (value === "√") {
            addFunction("sqrt");
            return;
        }

        if (["sin", "cos", "tan", "ln", "log"].includes(value)) {
            addFunction(value);
            return;
        }

        if (value === "π") {
            addConstant("pi");
            return;
        }

        if (value === "e") {
            addConstant("e");
            return;
        }

        if (value === "x²") {
            appendOperator("^");
            appendValue("2");
            return;
        }

        if (value === "xʸ") {
            appendOperator("^");
            return;
        }

        if (value === "x!") {
            appendValue("!");
            return;
        }

        if (value === "1/x") {
            if (!expression || error) return;

            setExpression(`1/(${expression})`);
            setDisplay(`1/(${expression})`);
            setJustCalculated(false);
            return;
        }

        if (["+", "-", "×", "÷", "^"].includes(value)) {
            appendOperator(
                value === "×"
                    ? "*"
                    : value === "÷"
                        ? "/"
                        : value
            );
            return;
        }

        appendValue(value);
    };

    return (
        <div
            className="w-full min-w-0 select-none text-white"
            aria-label="Calculator"
        >
            {/* Mode switcher */}
            <div className="mb-3 flex items-center justify-between gap-2">
                <div
                    className="inline-flex rounded-lg border border-white/10 bg-black/10 p-1"
                    role="tablist"
                    aria-label="Calculator mode"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "basic"}
                        onClick={() => setMode("basic")}
                        className={`rounded-md px-3 py-1.5 text-white text-xs font-semibold transition-all cursor-pointer 
                            ${mode === "basic"
                                ? "bg-white/15 text-white"
                                : "text-white/45 hover:text-white/80"
                            }
                        `}
                    >
                        Basic
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "scientific"}
                        onClick={() => setMode("scientific")}
                        className={`rounded-md px-3 py-1.5 text-white text-xs font-semibold transition-all cursor-pointer 
                            ${mode === "scientific"
                                ? "bg-white/15 text-white"
                                : "text-white/45 hover:text-white/80"
                            }
                        `}
                    >
                        Scientific
                    </button>
                </div>

                {scientific && (
                    <button
                        type="button"
                        onClick={() =>
                            setAngleMode((current) =>
                                current === "DEG" ? "RAD" : "DEG"
                            )
                        }
                        className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white cursor-pointer"
                        aria-label={`Angle mode: ${angleMode}. Click to switch.`}
                    >
                        {angleMode}
                    </button>
                )}
            </div>

            {/* Display */}
            <div
                className="mb-3 min-h-[90px] rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-right shadow-inner"
                aria-live="polite"
                aria-label={expression ? `Expression: ${expression}. Result: ${display}` : `Calculator display: ${display}`}
            >
                <div className="min-h-5 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-white/65">
                    {expression || " "}
                </div>

                <div
                    className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-3xl font-semibold 
                        ${error
                            ? "text-red-300"
                            : "text-white"
                        }
                    `}
                >
                    {display}
                </div>
            </div>

            {/* Scientific functions */}
            {scientific && (
                <div className="mb-2 grid grid-cols-4 gap-2">
                    {scientificButtons.flat().map((button) => (
                        <button
                            key={button}
                            type="button"
                            onClick={() => handleButton(button)}
                            aria-label={button}
                            className="h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/70 transition hover:bg-white/15 hover:text-white active:scale-[0.97] cursor-pointer"
                        >
                            {button}
                        </button>
                    ))}
                </div>
            )}

            {/* Main keypad */}
            <div className="grid grid-cols-4 gap-2">
                {basicButtons.flat().map((button) => {
                    const isOperatorButton = ["+", "-", "×", "÷",].includes(button);

                    const isUtility =
                        button === "AC" ||
                        button === "backspace" ||
                        button === "(" ||
                        button === ")";

                    return (
                        <button
                            key={button}
                            type="button"
                            onClick={() => handleButton(button)}
                            aria-label={button === "backspace" ? "Backspace" : button}
                            className={`h-11 rounded-xl border border-white/10 flex items-center justify-center text-sm font-semibold transition active:scale-[0.97] cursor-pointer 
                                ${isOperatorButton
                                    ? "bg-white/15 text-white hover:bg-white/20"
                                    : isUtility
                                        ? "bg-white/5 text-white/65 hover:bg-white/10"
                                        : "bg-black/10 text-white/85 hover:bg-white/[0.08]"
                                }
                            `}
                        >
                            {button === "backspace" ? (
                               <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-delete preview-icon"><path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/></svg>
                            ) : (
                                button
                            )}
                        </button>
                    );
                })}

                {/* Sign */}
                <button
                    type="button"
                    onClick={toggleSign}
                    aria-label="Toggle positive or negative"
                    className="h-11 rounded-xl border border-white/10 bg-black/10 text-sm font-semibold text-white/75 transition hover:bg-white/[0.08] active:scale-[0.97] cursor-pointer"
                >
                    ±
                </button>

                {/* Equals */}
                <button
                    type="button"
                    onClick={calculate}
                    aria-label="Equals"
                    className="col-span-3 h-11 rounded-xl border border-white/10 bg-white/60 text-sm font-semibold text-zinc-900 transition hover:bg-white/75 active:scale-[0.98] cursor-pointer"
                >
                    =
                </button>
            </div>

            {/* Keyboard hint
            <p className="mt-3 text-center text-[9px] text-white/25">
                Keyboard supported · Enter = calculate · Esc = clear
            </p> */}
        </div>
    );
};

export default Calculator;