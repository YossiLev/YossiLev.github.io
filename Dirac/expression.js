class EXP {
    constructor(node) {
        this.node = node; // { type: 'operator', op: '+', children: [...] }
    }

    static build(str) {
        str = str.replace(/\s+/g, ''); // Remove whitespace
        return new EXP(this._parse(str));
    }

    static _parse(str) {
        // Remove outer parentheses if they wrap the entire expression
        if (str.startsWith('(') && str.endsWith(')') && this._isBalanced(str.slice(1, -1))) {
            return this._parse(str.slice(1, -1));
        }

        // 1. Handle Addition/Subtraction (Lowest Precedence)
        let split = this._findSplit(str, ['+', '-']);
        if (split) {
            return {
                type: 'operator',
                op: split.char,
                children: [this._parse(split.left), this._parse(split.right)]
            };
        }

        // 2. Handle Multiplication/Division
        split = this._findSplit(str, ['*', '/']);
        if (split) {
            return {
                type: 'operator',
                op: split.char,
                children: [this._parse(split.left), this._parse(split.right)]
            };
        }

        // 3. Handle Functions (e.g., exp(...), sin(...))
        let funcMatch = str.match(/^([a-z]+)\((.*)\)$/i);
        if (funcMatch) {
            return {
                type: 'function',
                name: funcMatch[1],
                argument: this._parse(funcMatch[2])
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

    static _isBalanced(str) {
        let depth = 0;
        for (let char of str) {
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (depth < 0) return false;
        }
        return depth === 0;
    }

    // --- Output Formats ---

    toText(node = this.node) {
        if (node.type === 'number') return node.value;
        if (node.type === 'variable') return node.name;
        if (node.type === 'function') return `${node.name}(${this.toText(node.argument)})`;
        if (node.type === 'operator') {
            return `(${this.toText(node.children[0])}${node.op}${this.toText(node.children[1])})`;
        }
    }

    toLatex(node = this.node) {
        if (node.type === 'number') return node.value.replace('i', 'i');
        if (node.type === 'variable') return node.name;
        if (node.type === 'function') {
            const arg = this.toLatex(node.argument);
            if (node.name === 'exp') return `e^{${arg}}`;
            if (node.name === 'sqrt') return `\\sqrt{${arg}}`;
            return `\\${node.name}\\left(${arg}\\right)`;
        }
        if (node.type === 'operator') {
            const left = this.toLatex(node.children[0]);
            const right = this.toLatex(node.children[1]);
            if (node.op === '*') return `${left} \\cdot ${right}`;
            if (node.op === '/') return `\\frac{${left}}{${right}}`;
            return `${left} ${node.op} ${right}`;
        }
    }
}