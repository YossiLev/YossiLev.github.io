function expToText(x, acc = -1) {
    const node = x.node;
    if (node.type === 'number') return acc <= 0 ? node.value : Number(node.value).toFixed(acc).replace(/\.?0+$/, '');
    if (node.type === 'variable') return node.name;
    if (node.type === 'function') return `${node.name}(${expToText(node.argument, acc)})`;
    if (node.type === 'operator') {
        if (node.op === '-' && node.children.length === 1) {
            return `-${expToText(node.children[0], acc)}`;
        }
        let left = expToText(node.children[0], acc);
        let right = expToText(node.children[1], acc);
        if (node.children[0].node.type === 'operator' && EXP._precedence(node.children[0].node.op) < EXP._precedence(node.op)) {
            left = `(${left})`;
        }
        if (node.children[1].node.type === 'operator' && EXP._precedence(node.children[1].node.op) < EXP._precedence(node.op)) {
            right = `(${right})`;
        }     
        return `(${left}${node.op}${right})`;
    }
}


function expToLatex(x) {
    const node = x.node;
    if (node.type === 'number') return node.value.replace('i', 'i');
    if (node.type === 'variable') return node.name;
    if (node.type === 'function') {
        const arg = expToLatex(node.argument);
        if (node.name === 'exp') return `e^{${arg}}`;
        if (node.name === 'sqrt') return `\\sqrt{${arg}}`;
        return `\\${node.name}\\left(${arg}\\right)`;
    }
    if (node.type === 'operator') {
        if (node.op === '-' && node.children.length === 1) {
            return `-${expToLatex(node.children[0])}`;
        }
        let left = expToLatex(node.children[0]);
        let right = expToLatex(node.children[1]);
        if (node.children[0].node.type === 'operator' && EXP._precedence(node.children[0].node.op) < EXP._precedence(node.op)) {
            left = `(${left})`;
        }
        if (node.children[1].node.type === 'operator' && EXP._precedence(node.children[1].node.op) < EXP._precedence(node.op)) {
            right = `(${right})`;
        }            
        if (node.op === '*') return `${left} \\cdot ${right}`;
        if (node.op === '/') return `\\frac{${left}}{${right}}`;
        if (node.op === '^') return `${left}^{${right}}`;
        return `${left} ${node.op} ${right}`;
    }
}

function parseParams(input) {
    const dict = {};
    if (!input || typeof input !== 'string') return dict;

    // 1. Split by comma
    const pairs = input.split(',');

    pairs.forEach(pair => {
        // 2. Split by equals sign
        let [key, val] = pair.split('=');
        
        if (key && val !== undefined) {
            key = key.trim();
            val = val.trim();

            // 3. Try to convert to number, otherwise keep as string
            const num = Number(val);
            dict[key] = isNaN(num) ? val : num;
        }
    });

    return dict;
}

class EXP {
    constructor(node) {
        this.node = node; // { type: 'operator', op: '+', children: [...] }
    }

    static build(str) {
        str = str.replace(/\s+/g, ''); // Remove whitespace
        return new EXP(this._parse(str));
    }

    static _parse(str) {
        if (str.length === 0) {
            return { type: 'number', value: "1", level: 0 }; // Treat empty string as 1
        }
        // Remove outer parentheses if they wrap the entire expression
        if (str.startsWith('-') && this._isBalanced(str.slice(1))) {
            return {
                type: 'operator',
                op: '-',
                children: [new EXP(this._parse(str.slice(1)))],
                level: 1
            };
        }
        if (str.startsWith('(') && str.endsWith(')') && this._isBalanced(str.slice(1, -1))) {
            return this._parse(str.slice(1, -1));
        }

        // 1. Handle Addition/Subtraction (Lowest Precedence)
        let split = this._findSplit(str, ['+', '-']);
        if (split) {
            return {
                type: 'operator',
                op: split.char,
                children: [new EXP(this._parse(split.left)), new EXP(this._parse(split.right))],
            };
        }

        // 2. Handle Multiplication/Division
        split = this._findSplit(str, ['*', '/']);
        if (split) {
            return {
                type: 'operator',
                op: split.char,
                children: [new EXP(this._parse(split.left)), new EXP(this._parse(split.right))],
            };
        }
        split = this._findSplit(str, ['^']);
        if (split) {
            return {
                type: 'operator',
                op: split.char,
                children: [new EXP(this._parse(split.left)), new EXP(this._parse(split.right))],
            };
        }

        // 3. Handle Functions (e.g., exp(...), sin(...))
        let funcMatch = str.match(/^([a-z]+)\((.*)\)$/i);
        if (funcMatch) {
            return {
                type: 'function',
                name: funcMatch[1],
                argument: new EXP(this._parse(funcMatch[2])),
                level: 0
            };
        }

        // 4. Handle Leaf Nodes (Numbers, Complex Numbers, Variables)
        if (/^\d+(\.\d+)?(i)?$/.test(str) || /^c\(.*\)$/.test(str)) {
            return { type: 'number', value: str };
        }
        
        return { type: 'variable', name: str };
    }

    /**
     * Finds the rightmost operator not inside parentheses
     */
    static _findSplit(str, operators) {
        let depth = 0;
        for (let i = str.length - 1; i >= 0; i--) {
            const char = str[i];
            if (char === ')') depth++;
            if (char === '(') depth--;
            if (depth === 0 && operators.includes(char)) {
                // Check if it's a unary minus at the start
                if (i === 0) continue; 
                return { char, left: str.substring(0, i), right: str.substring(i + 1) };
            }
        }
        return null;
    }

    static _op(a, b, op) {
        return new EXP({
            type: 'operator',
            op: op,
            children: b ? [a, b] : [a] // For unary minus
        });
    }
    static add(a, b) {
        return this._op(a, b, '+');
    }
    static subtract(a, b) {
        return this._op(a, b, '-');
    }
    static multiply(a, b) {
        if (a.node.type === 'number' && a.node.value === '0' ||
            b.node.type === 'number' && b.node.value === '1'
        ) return a;
        if (b.node.type === 'number' && b.node.value === '0' ||
            a.node.type === 'number' && a.node.value === '1'
        ) return b;
        return this._op(a, b, '*');
    }
    static divide(a, b) {
        return this._op(a, b, '/');
    }
    static negate(a) {
        return this._op(a, null, '-');
    }

    static simplifyNumbers(exp) {
        const hasLetters = /[a-z]/i.test(exp.toString());
        if (!hasLetters) {
            const sim = math.simplify(exp.toString());  
            return EXP.build(sim.toString());
        }
        return exp;
    }

    static _isBalanced(str) {
        let depth = 0;
        for (let char of str) {
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (depth < 0) return false;
        }
        return depth === 0;
    }

    static _precedence(op) {
        if (op === '+' || op === '-') return 1;
        if (op === '*' || op === '/') return 2;
        if (op === '^') return 3;
        return 0;
    }


    evaluate(variablesStr = "") {
        const variables = parseParams(variablesStr);
        return this._evaluateNode(this.node, variables);
    }

    _evaluateNode(node, variables) {
        if (node.type === 'number') {
            if (node.value.startsWith('c(')) {
                const parts = node.value.slice(2, -1).split(',').map(Number);
                return math.complex(parts[0], parts[1]);
            }
            return math.evaluate(node.value);
        }
        if (node.type === 'variable') {
            if (variables[node.name] !== undefined) {
                return variables[node.name];
            }
            throw new Error(`Variable ${node.name} not defined`);
        }
        if (node.type === 'function') {
            const arg = this._evaluateNode(node.argument.node, variables);
            if (node.name === 'exp') return math.exp(arg);
            if (node.name === 'sqrt') return math.sqrt(arg);
            if (node.name === 'sin') return math.sin(arg);
            if (node.name === 'cos') return math.cos(arg);
            if (node.name === 'tan') return math.tan(arg);
            if (node.name === 'log') return math.log(arg);
            if (node.name === 'cosh') return math.cosh(arg);
            if (node.name === 'sinh') return math.sinh(arg);
            if (math[node.name]) return math[node.name](arg);
            throw new Error(`Unknown function ${node.name}`);
        }
        if (node.type === 'operator') {
            if (node.op === '-' && node.children.length === 1) {
                const val = this._evaluateNode(node.children[0].node, vßariables);
                return math.multiply(-1, val);
            }
            const left = this._evaluateNode(node.children[0].node, variables);
            const right = this._evaluateNode(node.children[1].node, variables);
            if (node.op === '+') return math.add(left, right);
            if (node.op === '-') return math.subtract(left, right);
            if (node.op === '*') return math.multiply(left, right);
            if (node.op === '/') return math.divide(left, right);
            if (node.op === '^') return math.pow(left, right);
            throw new Error(`Unknown operator ${node.op}`);
        }
    }
    // --- Output Formats ---

    toString(acc = -1) {
        return expToText(this, acc);
    }

    toLatex() {
        return expToLatex(this);
    }
}