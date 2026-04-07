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
            let coeff, blade;

            if (bladeMatch) {
                blade = bladeMatch[1];
                coeff = EXP.build(content.substring(0, content.length - blade.length) || "1");
            } else {
                // It's a pure scalar
                blade = "1";
                coeff = EXP.build(content);
            }

            if (blade === "I") blade = "g0123";

            // 4. Combine Op + Coeff and simplify
            let rawCoeff = EXP.build(op + "(" + this._cleanCoeff(coeff.toString()) + ")");
            //let simplifiedCoeff = math.simplify(rawCoeff).toString();

            // 5. Accumulate
            if (terms[blade]) {
                terms[blade] = EXP.add(terms[blade], rawCoeff);
            } else {
                terms[blade] = rawCoeff;
            }
        }

        return new CL(terms)._prune();
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
                const combined = EXP.add(newTerms[blade], coeff);
                newTerms[blade] = combined;//.toString();
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
                const combined = EXP.subtract(newTerms[blade], coeff);
                newTerms[blade] = combined;//.toString();
            } else {
                // If the blade wasn't there, it becomes -(coeff)
                const inverted = EXP    .negate(coeff);
                newTerms[blade] = inverted;
            }
        }
        return new CL(newTerms);
    }

    mult(other) {
        let resultTerms = {};
        for (let [b1, c1] of Object.entries(this.terms)) {
            for (let [b2, c2] of Object.entries(other.terms)) {
                const { blade, sign } = this._geometricProduct(b1, b2);
                const combined = EXP.multiply(EXP.multiply(c1, c2), EXP.build(sign.toString()));
                const simplified = combined; // No need to simplify further since we're working symbolically
                
                resultTerms[blade] = resultTerms[blade] 
                    ? EXP.add(resultTerms[blade], simplified)
                    : simplified;
            }
        }
        return new CL(resultTerms);
    }

    static bladeFilterd(blade) {
        if (blade === "1") return blade;
        let nBlade = 'g' +blade.split('').slice(1).sort().join('');
        return nBlade;
    }

    _prune() {
        let updated = {}
        for (let blade in this.terms) {
            let canonBlade = CL.bladeFilterd(blade);
            if (updated[canonBlade]) {
                updated[canonBlade] = EXP.add(updated[canonBlade], this.terms[blade]);
            } else {
                updated[canonBlade] = this.terms[blade];
            }
        }

        this.terms = {};
        const skeys = Object.keys(updated).sort();
        for (let i in skeys) {
            const blade = skeys[i];
            const coeffStr = CL.disp(updated[blade].toString(), 5);
            if (coeffStr != "0") {
                this.terms[blade] = EXP.simplifyNumbers(updated[blade]);
            }
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
        // Check if it's a single biv§ector term for this simple identity
        // const h1 = this.square().toString();
        // const h2 = this.square()._prune().toString();
        // const h3= math.simplify(h2).toString();    
        const sq = Number(math.evaluate(this.square()._prune().toString()));
        const root = math.sqrt(math.abs(sq));
        const cCoefStr = sq < 0 ? `cos(sqrt(${sq}))` : `cosh(sqrt(${sq}))`;
        const sCoefStr = sq < 0 ? `sin(sqrt(${sq}))` : `sinh(sqrt(${sq})) / sqrt(${sq})`;

        const expXStringAdd = CL.build(`${cCoefStr}1`);
        const expXStringMult = CL.build(`${sCoefStr}1`);
        return expXStringAdd.add(expXStringMult.mult(this));
    // if sq == 0        throw new Error("General symbolic exp() requires a Taylor expansion parser.");
    }

    square() {
        return this.mult(this);
    }
    power(n) {
        let result = CL.build("1");
        for (let i = 0; i < n; i++) {
            result = result.mult(this);
        }
        return result;
    }

    commute(other) {
        return this.mult(other).sub(other.mult(this));
    }
    mat(basis = "d") {
        const matrices = this._getBasisMatrices(basis);
        const z = math.complex(0);
        let finalMat = [[z,z,z,z],[z,z,z,z],[z,z,z,z],[z,z,z,z]];

        for (let [blade, coeff] of Object.entries(this.terms)) {
            let bladeMat = this._getBladeMatrix(blade, matrices);
            let scalar = math.evaluate(CL._cleanCoeff(coeff.toString()));
            finalMat = CL._addCMat4(finalMat, CL._multCMat4Scalar(scalar, bladeMat));
        }
        return finalMat;
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

    static _complexKron(a, b) {
        const rowsA = a.length, colsA = a[0].length;
        const rowsB = b.length, colsB = b[0].length;
        let result = math.zeros(rowsA * rowsB, colsA * colsB)._data;

        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsA; j++) {
                const aVal = math.complex(a[i][j]);
                for (let k = 0; k < rowsB; k++) {
                    for (let l = 0; l < colsB; l++) {
                        result[i*rowsB + k][j*colsB + l] = math.multiply(aVal, math.complex(b[k][l]));
                    }
                }
            }
        }
        return result;
    }

    _getBasisMatrices(basis) {
        const one = math.complex(1);
        const z = math.complex(0);
        const i = math.complex(0, 1);
        const m1 = math.complex(-1, 0);
        const mi = math.complex(0, -1);
        const I2 = [[one, z], [z, one]];
        const s1 = [[z, one], [one, z]], s2 = [[z, mi], [i, z]], s3 = [[one, z], [z, m1]];

        if (basis === "d") { // Dirac Basis
            return [
                CL._complexKron([[one, z], [z, m1]], I2), // g0
                CL._complexKron([[z, one], [m1, z]], s1), // g1
                CL._complexKron([[z, one], [m1, z]], s2), // g2
                CL._complexKron([[z, one], [m1, z]], s3)  // g3
            ];
        } else { // Weyl (Chiral) Basis
            return [
                CL._complexKron([[z, one], [one, z]], I2), // g0
                CL._complexKron([[z, one], [m1, z]], s1), // g1
                CL._complexKron([[z, one], [m1, z]], s2), // g2
                CL._complexKron([[z, one], [m1, z]], s3)  // g3
            ];
        }
    }

    static _multCMat4(A, B) {
        const rowsA = A.length, colsA = A[0].length;
        const rowsB = B.length, colsB = B[0].length;
        let result = math.zeros(rowsA, colsB)._data;

        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                let sum = math.complex(0);
                for (let k = 0; k < colsA; k++) {
                    sum = math.add(sum, math.multiply(math.complex(A[i][k]), math.complex(B[k][j])));
                }
                result[i][j] = sum;
            }
        }
        return result;
    }
    static _multCMat4Scalar(scalar, A) {
        const rows = A.length, cols = A[0].length;
        let result = math.zeros(rows, cols)._data;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[i][j] = math.multiply(math.complex(scalar), math.complex(A[i][j]));
            }
        }
        return result;
    }
    static _addCMat4(A, B) {
        const rows = A.length, cols = A[0].length;
        let result = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[i][j] = math.add(math.complex(A[i][j]), math.complex(B[i][j]));
            }
        }
        return result;
    }
    _getBladeMatrix(blade, basisMats) {
        const z = math.complex(0);
        const one = math.complex(1);
        const i = math.complex(0, 1);
        const mi = math.complex(0, -1);
        const unitMat = [[one,z,z,z],[z,one,z,z],[z,z,one,z],[z,z,z,one]];
        if (blade === "1") return unitMat;
        const indices = blade.replace('g', '').split('').map(Number);
        return indices.reduce((acc, idx) => CL._multCMat4(acc, basisMats[idx]), unitMat);
    }

    /**
     * Returns a string representation of the CL object.
     */
    toString(acc = -1) {
        const terms = Object.entries(this.terms);
        if (terms.length === 0) return "0";
        return terms.map(([blade, coeff]) => {
            if (blade === "1") return coeff.toString(acc);
            if (coeff.toString() === "1") return blade;
            return `${coeff.toString(acc)}${blade}`;
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
        let str = Number(math.evaluate(num).toString()).toFixed(acc);
        return str.replace(/\.?0+$/, ''); // Remove trailing zeros
    }
    toLatex(acc = 3) {
        return '\\(' + this.toLatexn(acc) + '\\)';
    }
    toLatexn(acc = 3) {
        this._prune();
        const terms = Object.entries(this.terms);
        if (terms.length === 0) return "0";
        return terms.map(([blade, coeff]) => {
            let coeffStr = coeff.toString();
            let coeffLatex = CL._latexCoeff(CL.disp(coeffStr, acc));
            if (blade === "1") return coeffLatex;
            if (coeff.toString() === "1") return CL._latexBlade(blade);
            if (coeff.toString() === "-1") coeffLatex = "-";
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