class Poly {
    constructor(name = 'local') {
        this.name = name;
        this.clear();
        this.coeffs = [-1, 0, 0.003]
    }

    clear() {
        this.coeffs = [];
    }
    copy() {
        let newPoly = new Poly();
        newPoly.name = this.name;
        newPoly.coeffs = [...this.coeffs];

        return newPoly;
    }
    serialize(name = '') {
        if (name.length <= 0) {
            name = this.name;
        }
        let coeffsStr = this.coeffs.map(p => `${p[0]}`).join(':');
        return `${name}#${coeffsStr}`;
    }
    static deserialize(s) {
        let [name, coeffsStr] = s.split('#');
        let poly = new Poly(name);
        poly.points = coeffsStr.split(':').map(s => parseFloat);
        return poly;
    }

    y(x) {
        return this.coeffs.reduce((acc, c, ic) => acc + c * Math.pow(x, ic), 0);
    }

    drawPoly(ctx, tr, opt = {}) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'gray';
        ctx.beginPath();
        ctx.lineTo(...tPoint([-200, 0], tr));
        ctx.lineTo(...tPoint([200, 0], tr));
        ctx.stroke();
        ctx.beginPath();
        ctx.lineTo(...tPoint([0, -200], tr));
        ctx.lineTo(...tPoint([0, 200], tr));
        ctx.stroke();
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(...tPoint([-100, this.y(-100)], tr));
        for (let x = -100; x < 100; x += 0.2) {
            ctx.lineTo(...tPoint([x, this.y(x)], tr));
        }
        ctx.stroke();
    }
}
