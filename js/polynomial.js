class Polynomial {
    constructor(dim) {
        this.positive = Array.from({length: dim}).map(() => 0);
        this.negative = Array.from({length: dim}).map(() => 0);
    }
    toString(label = "q") {
        const pos = this.positive.map((p, ip) =>
            (p !== 0 ? p !== 1 ? `${p} ${label}^${ip}` : `${label}^${ip}` : ''))
            .filter(s => s.length > 0).reverse();
        const neg = this.negative.map((p, ip) =>
            (p !== 0 ? p !== 1 ? `${p} ${label}^-${ip}` : `${label}^-${ip}` : ''))
            .filter(s => s.length > 0);
        return pos.concat(neg).join(' + ').replaceAll('+ -', '- ');
    }
    copy() {
        const l = this.positive.length;
        let cp = new Polynomial(l);
        for (let i = 0; i < l; i++) {
            cp.positive[i] = this.positive[i];
            cp.negative[i] = this.negative[i];
        }
        return cp;
    }
    static toHtml1pos(c, p, label) {
        if (c === 0) return '';
        if (c === 1) return `${label}<sup>${p}</sup>`;
        if (c === -1) return `- ${label}<sup>${p}</sup>`;
        return `${c}${label}<sup>${p}</sup>`;
    }
    static toHtml1Neg(c, p, label) {
        if (c === 0) return '';
        if (c === 1) return `${label}<sup>-${p}</sup>`;
        if (c === -1) return `- ${label}<sup>-${p}</sup>`;
        return `${c}${label}<sup>-${p}</sup>`;
    }
    toHtml(label = "q") {
        const pos = this.positive.map((p, ip) => Polynomial.toHtml1pos(p, ip, label))
            .filter(s => s.length > 0).reverse();
        const neg = this.negative.map((p, ip) => Polynomial.toHtml1Neg(p, ip, label))
            .filter(s => s.length > 0);
        return pos.concat(neg).join(' + ').replaceAll('+ -', '- ');
    }
    add(other, factor = 1) {
        this.positive.forEach((xpp, i) => {
            this.positive[i] += factor * other.positive[i];
            this.negative[i] += factor * other.negative[i];
        });
        return this;
    }
    divide(other) {
        let num = this.copy().shift(50);
        let den = other.copy().shift(20);
        let res = new Polynomial(100);
        let topDen = den.highest();

        while (num.highest() >= topDen) {
            let topNum = num.highest();
            let div = num.positive[topNum] / den.positive[topDen];
            res.positive[topNum - topDen] += div;
            num.positive[topNum] = 0;
            for (let i = topDen - 1; i >= 0; i--) {
                if (Math.abs(den.positive[i]) > 0.000001) {
                    num.positive[i + topNum - topDen] -= div * den.positive[i];
                }
            }
        }
        if (num.highest() >= 0) {
            console.log('ERROR in div')
        }
        return res.shift(- 30);
    }
    highest() {
        for (let i = this.positive.length - 1; i >= 0; i--) {
            if (Math.abs(this.positive[i]) > 0.000001) {
                return i;
            }
        }
        return - 1;
    }
    jNorm() {
        return this.copy().divide(Polynomial.buildPower(1));
    }
    shift(amount) {
        let i;
        let l = this.positive.length;
        if (amount > 0) {
            for (i = l - 1; i >= amount; i--) {
                this.positive[i] = this.positive[i - amount];
            }
            for (i = amount - 1; i >= 0; i--) {
                this.positive[i] = this.negative[amount - i];
            }
            for (i = 1; i < l - amount; i++) {
                this.negative[i] = this.negative[amount + i];
            }
        }
        if (amount < 0) {
            for (i = l - 1; i > - amount; i--) {
                this.negative[i] = this.negative[i + amount];
            }
            for (i = - amount; i > 0; i--) {
                this.negative[i] = this.positive[- amount - i];
            }
            for (i = 0; i < l + amount; i++) {
                this.positive[i] = this.positive[- amount + i];
            }
        }
        return this;
    }
    shrink() {
        let l = this.positive.length;
        for (let i = 1; i < l; i++) {
            if (i * 2 < l) {
                this.positive[i] = this.positive[i * 2];
                this.negative[i] = this.negative[i * 2];
            } else {
                this.positive[i] = 0;
                this.negative[i] = 0;
            }
        }
        return this;
    }
    static buildPower(p) {
        let g = new Polynomial(100);
        let n = 1;
        let d = 1;
        let v = [];

        for (let i = 1; i <= p / 2 + 1; i++) {
            v.push(n / d);
            d *= i;
            n *= p  + 1 - i;
        }
        let s = p % 2;
        v.forEach((x, ix) => {
            let power = s + 2 * (Math.floor(p / 2) - ix);
            g.positive[power] = x;
            g.negative[power] = x;
        });
        g.negative[0] = 0;
        return g;
    }

}
