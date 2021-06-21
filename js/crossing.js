class Crossing {
    constructor(x, y, type = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
    }
    copy() {
        return new Crossing(this.x, this.y, this.type);
    }
    serialize() {
        return `${this.type},${this.x},${this.y}`;
    }
    static deserialize(s) {
        let [type, x, y] = s.split(',').map(parseFloat);
        return new Crossing(x, y, type);
    }
    getCross(p1, p2, c = 10) {
        let d1 = this.isInside(p1[0], p1[1]);
        let pm = [0.5 * (p1[0] + p2[0]), 0.5 * (p1[1] + p2[1])];
        let dm = this.isInside(pm[0], pm[1]);
        if (c < 0) {
            return pm;
        }
        if (dm === d1) {
            return this.getCross(pm, p2, c - 1);
        }
        return this.getCross(pm, p1, c - 1);
    }
    finalize(ps) {
        let stateIn = false;
        this.pc = []
        this.pNear = []
        ps.forEach((p, ip) => {
            if (ip > 0 && (!stateIn) === (sumSqr(p[0] - this.x, p[1] - this.y) < rad2)) {
                stateIn = !stateIn;
                this.pc.push([...this.getCross(ps[ip - 1], p), ip - (stateIn ? 0: 1)]);
                this.pNear.push([-1, -1, -1]);
            }
        });
        if (this.pc.length === 4) {
            const z = (this.pc[1][0] - this.pc[0][0]) * (this.pc[3][1] - this.pc[2][1]) -
                (this.pc[1][1] - this.pc[0][1]) * (this.pc[3][0] - this.pc[2][0]);
            if (z < 0) {
                // switching if needed to make the first pair
                this.pc = [this.pc[2], this.pc[3], this.pc[0], this.pc[1]];
            }
        }
    }
    drawLine(ctx, i1, i2, tr) {
        ctx.beginPath();
        ctx.moveTo(...tPoint(this.pc[i1], tr));
        ctx.lineTo(...tPoint(this.pc[i2], tr));
        ctx.stroke();
    }
    drawStyleLine(ctx, i1, i2, tr, width, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        this.drawLine(ctx, i1, i2, tr)
    }

    drawCrossing(ctx, ps, tr, opt) {
        const type = typeByOpt(this.type, opt);
        const lines = linesByType(type);
        const colorCross = ["black", "red", "blue", "brown", "green"][type];
        const wide = type === 1 || type === 2;

        ctx.fillStyle = type === 0 ? 'yellow' : 'white';
        ctx.beginPath();
        ctx.arc(...tPoint([this.x, this.y], tr), rad * tr.z, 0, 2 * Math.PI);
        ctx.fill();
        if (!butOpt('HideCircles')) {
            ctx.stroke();
        }

        if (this.pc?.length === 4) {
            this.drawStyleLine(ctx, lines[0][0], lines[0][1], tr, 1, 'black');
            if (wide) {
                this.drawStyleLine(ctx, lines[1][0], lines[1][1], tr, 7, 'white');
            }
            this.drawStyleLine(ctx, lines[1][0], lines[1][1], tr, 1, 'black');

            if (!butOpt('HideCircles')) {
                ctx.strokeStyle = colorCross;
                ctx.beginPath();
                ctx.arc(...tPoint([this.x, this.y], tr), rad * tr.z, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
    }
    isInside(x, y, factor = 1) {
        return sumSqr(this.x - x, this.y - y) < (rad2 * factor);
    }
    action(x, y) {
        if (this.isInside(x, y, 4.0)) {
            switch (mode) {
                case 2: // crossing
                    this.type = this.type === 1 ? 2 : 1;
                    break;
                case 3: // divide
                    this.type = this.type === 3 ? 4 : 3;
                    break;
            }
        }

    }
    invert() {
        this.type = this.type === 1 ? 2 : 1;
    }

}
