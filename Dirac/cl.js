class CL {
    constructor(terms = {}) {
        // terms: { "g1": "c(1)", "g12": "c(2)" }
        this.terms = terms;
        this._prune();
    }

    /**
     * Helper to normalize "c(x, y)" to mathjs compatible "complex(x, y)"
     */
    static _cleanCoeff(str) {
        return str.replace(/c\(([^,)]+),?([^)]*)\)/g, (match, x, y) => {
            return y.trim() ? `complex(${x},${y})` : `complex(${x},0)`;
        });
    }
    /**
     * Parses a string like "c(2)g1+g12" into a CL object.
     */
    static build(str) {
        const terms = {};
        
        // 1. Remove all whitespace for easier processing
        let cleanStr = str.replace(/\s+/g, '');

        // 2. Tokenize: This regex finds terms by looking for + or - 
        // that are NOT inside parentheses (to protect c(1,-1)).
        // It captures the operator and the content following it.
        const termRegex = /((?:^|[+-])(?![^()]*\)))([^+-]+(?:\([^()]*\))?[^+-]*)/g;
        let match;

        while ((match = termRegex.exec(cleanStr)) !== null) {
            let op = match[1];      // "+" or "-" or "" (at start)
            let content = match[2]; // e.g., "1g1", "c(2)g0", "I"

            // Handle the leading "+" case or empty op at start
            if (op === "+") op = ""; 
            
            // 3. Separate Coefficient from Blade
            // Finds the boundary where the blade (g..., I, or 1) starts
            let bladeMatch = content.match(/(g\d+|I|1)$/);
            let coeffStr, blade;

            if (bladeMatch) {
                blade = bladeMatch[1];
                coeffStr = content.substring(0, content.length - blade.length) || "1";
            } else {
                // It's a pure scalar
                blade = "1";
                coeffStr = content;
            }

            if (blade === "I") blade = "g0123";

            // 4. Combine Op + Coeff and simplify
            let rawCoeff = op + "(" + this._cleanCoeff(coeffStr) + ")";
            let simplifiedCoeff = math.simplify(rawCoeff).toString();

            // 5. Accumulate
            if (terms[blade]) {
                terms[blade] = math.simplify(`(${terms[blade]}) + (${simplifiedCoeff})`).toString();
            } else {
                terms[blade] = simplifiedCoeff;
            }
        }

        return new CL(terms)._prune();
    }
    static build2(str) {
        const terms = {};
        const parts = str.split(/\+(?![^\(]*\))/);
        parts.forEach(part => {
            let [_, coeff, blade] = part.trim().match(/^([^(g|1|I)]+)?(g\d+|1|I)$/) || [null, part, "1"];
            coeff = coeff ? this._cleanCoeff(coeff) : "1";
            if (blade === "I") blade = "g0123";
            terms[blade] = math.simplify(coeff).toString();
        });
        return new CL(terms);
    }

    // --- Arithmetic ---

/**
     * Symbolic Addition: (a) + (b)
     */
    add(other) {
        const newTerms = { ...this.terms };
        
        for (let [blade, coeff] of Object.entries(other.terms)) {
            if (newTerms[blade]) {
                // Wrap in parens to ensure algebra order: (old) + (new)
                const combined = `(${newTerms[blade]}) + (${coeff})`;
                newTerms[blade] = math.simplify(combined).toString();
            } else {
                newTerms[blade] = coeff;
            }
        }
        return new CL(newTerms);
    }

    /**
     * Symbolic Subtraction: (a) - (b)
     */
    sub(other) {
        const newTerms = { ...this.terms };
        
        for (let [blade, coeff] of Object.entries(other.terms)) {
            if (newTerms[blade]) {
                // Wrap in parens: (old) - (new)
                const combined = `(${Number(newTerms[blade])}) - (${Number(coeff)})`;
                newTerms[blade] = math.simplify(combined).toString();
            } else {
                // If the blade wasn't there, it becomes -(coeff)
                const inverted = `-(${coeff})`;
                newTerms[blade] = math.simplify(inverted).toString();
            }
        }
        return new CL(newTerms);
    }

    mult(other) {
        let resultTerms = {};
        for (let [b1, c1] of Object.entries(this.terms)) {
            for (let [b2, c2] of Object.entries(other.terms)) {
                const { blade, sign } = this._geometricProduct(b1, b2);
                const combined = `(${c1}) * (${c2}) * ${sign}`;
                const simplified = math.simplify(combined).toString();
                
                resultTerms[blade] = resultTerms[blade] 
                    ? math.simplify(`(${resultTerms[blade]}) + (${simplified})`).toString()
                    : simplified;
            }
        }
        return new CL(resultTerms);
    }

    _prune() {
        for (let blade in this.terms) {
            if (this.terms[blade] === "0") delete this.terms[blade];
        }
        return this;
    }

    _geometricProduct(b1, b2) {
        if (b1 === "1") return { blade: b2, sign: 1 };
        if (b2 === "1") return { blade: b1, sign: 1 };

        let indices = [...b1.replace('g',''), ...b2.replace('g','')].map(Number);
        let sign = 1;
        let swapped = true;

        while (swapped) {
            swapped = false;
            for (let i = 0; i < indices.length - 1; i++) {
                if (indices[i] > indices[i+1]) {
                    [indices[i], indices[i+1]] = [indices[i+1], indices[i]];
                    sign *= -1;
                    swapped = true;
                } else if (indices[i] === indices[i+1]) {
                    // STA Metric: g0^2 = 1, g_i^2 = -1 for i > 0
                    if (indices[i] !== 0) sign *= -1;
                    indices.splice(i, 2);
                    swapped = true;
                    break;
                }
            }
        }
        return { blade: indices.length === 0 ? "1" : "g" + indices.join(''), sign };
    }

    // --- Functions ---

    exp() {
        // Simple implementation for bivectors: exp(theta*B) = cos(theta) + sin(theta)B
        // Check if it's a single bivector term for this simple identity
        const sq = Number(this.square().toString());
        const root = math.sqrt(math.abs(sq));
        const cCoef = sq < 0 ? Math.cos(root) : Math.cosh(root);
        const sCoef = (sq < 0 ? Math.sin(root) : Math.sinh(root)) / root;

        const expXStringAdd = CL.build(`${cCoef}1`);
        const expXStringMult = CL.build(`${sCoef}1`);
        return expXStringAdd.add(expXStringMult.mult(this));
    // if sq == 0        throw new Error("General symbolic exp() requires a Taylor expansion parser.");
    }

    square() {
        return this.mult(this);
    }

    commute(other) {
        return this.mult(other).sub(other.mult(this));
    }
    mat(basis = "d") {
        const matrices = this._getBasisMatrices(basis);
        let finalMat = math.matrix(math.zeros([4, 4], 'complex'));

        for (let [blade, coeff] of Object.entries(this.terms)) {
            let bladeMat = this._getBladeMatrix(blade, matrices);
            let scalar = math.evaluate(CL._cleanCoeff(coeff));
            finalMat = math.add(finalMat, math.multiply(scalar, bladeMat));
        }
        return finalMat.toArray();
    }

    visualizeMat(basis = "d") {
        const matrix = this.mat(basis);
        let html = `<div class="cl-matrix"><h3>Basis: ${basis === 'd' ? 'Dirac' : 'Weyl'}</h3>`;
        html += `<table style="border-collapse: collapse; font-family: monospace;">`;
        
        matrix.forEach(row => {
            html += `<tr>`;
            row.forEach(cell => {
                const val = math.complex(cell);
                const color = (val.re !== 0 || val.im !== 0) ? "#eef" : "#fff";
                const label = val.format(4).replace(/\s/g, '');
                html += `<td style="border: 1px solid #ccc; padding: 8px; background: ${color}; min-width: 80px; text-align: center;">
                            ${label}
                        </td>`;
            });
            html += `</tr>`;
        });
        
        html += `</table></div>`;
        return html;
    }

    _getBasisMatrices(basis) {
        const I2 = math.identity(2);
        const s0 = I2;
        const s1 = [[0, 1], [1, 0]], s2 = [[0, 'i'], ['-i', 0]], s3 = [[1, 0], [0, -1]];

        if (basis === "d") { // Dirac Basis
            return [
                math.kron([[1, 0], [0, -1]], I2), // g0
                math.kron([[0, 1], [-1, 0]], s1), // g1
                math.kron([[0, 1], [-1, 0]], s2), // g2
                math.kron([[0, 1], [-1, 0]], s3)  // g3
            ];
        } else { // Weyl (Chiral) Basis
            return [
                math.kron([[0, 1], [1, 0]], I2), // g0
                math.kron([[0, 1], [-1, 0]], s1),
                math.kron([[0, 1], [-1, 0]], s2),
                math.kron([[0, 1], [-1, 0]], s3)
            ];
        }
    }

    _getBladeMatrix(blade, basisMats) {
        if (blade === "1") return math.identity(4);
        const indices = blade.replace('g', '').split('').map(Number);
        return indices.reduce((acc, idx) => math.multiply(acc, basisMats[idx]), math.identity(4));
    }

    /**
     * Returns a string representation of the CL object.
     */
    toString() {
        const terms = Object.entries(this.terms);
        if (terms.length === 0) return "0";
        return terms.map(([blade, coeff]) => {
            if (blade === "1") return coeff;
            if (coeff === "1") return blade;
            return `${coeff}${blade}`;
        }).join(" + ");//.replaceAll("+ -", "- ");
    }
    static _latexCoeff(str) {
        return str.replace(/c\(([^,)]+),?([^)]*)\)/g, (match, x, y) => {
            return y.trim() ? `\\left(${x} + ${y}i\\right)` : `\\left(${x}\\right)`;
        });
    }
    static _latexBlade(blade) {
        if (blade === "1") return "";
        return blade.replace(/g(\d+)/g, (_, idx) => `\\gamma_{${idx}}`);
    }
    static disp(num, acc) {
        let str = Number(math.simplify(num)).toFixed(acc);
        return str.replace(/\.?0+$/, ''); // Remove trailing zeros
    }
    toLatex(acc = 3) {
        return '\\(' + this.toLatexn(acc) + '\\)';
    }
    toLatexn(acc = 3) {
        const terms = Object.entries(this.terms);
        if (terms.length === 0) return "0";
        return terms.map(([blade, coeff]) => {
            let coeffLatex = CL._latexCoeff(CL.disp(coeff, acc));
            if (blade === "1") return coeffLatex;
            if (coeff === "1") return CL._latexBlade(blade);
            if (coeff === "-1") coeffLatex = "-";
            return `${coeffLatex} ${CL._latexBlade(blade)}`;
        }).join(" + ").replace(/\+\s-/g, "- ");
    }
    toLatexP(acc = 3) {
        if (Object.entries(this.terms).length > 1) {
            return '(' + this.toLatex(acc) + ')';
        }
        return this.toLatex(acc);
    }
}