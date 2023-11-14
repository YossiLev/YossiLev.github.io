class FuncList {
    constructor(func = null, name = 'local') {
        this.name = name;
        this.func = func;
        this.clear();
    }

    clear() {
        this.points = [];
        this.targets = [];
        this.crossings = [];
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
        this.nLoops = 0;
        this.nPositiveCross = 0;
        this.conFocus = - 1;
    }
    copy() {
        let newKnot = new Knot();
        newKnot.name = this.name;
        newKnot.points = this.points.map(p => [p[0], p[1]]);
        newKnot.crossings = this.crossings.map(c => c.copy());
        newKnot.minX = this.minX;
        newKnot.maxX = this.maxX;
        newKnot.minY = this.minY;
        newKnot.maxY = this.maxY;
        newKnot.nLoops = this.nLoops;
        newKnot.nPositiveCross = this.nPositiveCross;

        return newKnot;
    }
    serialize(name = '') {
        if (name.length <= 0) {
            name = this.name;
        }
        let pointsStr = this.points.map(p => `${p[0]},${p[1]}`).join(':');
        let crossStr = this.crossings.map(c => c.serialize()).join(':');
        return `${name}#${pointsStr}#${crossStr}`;
    }
    static deserialize(s) {
        let [name, pointsStr, crossStr] = s.split('#');
        let knot = new Knot(name);
        knot.points = pointsStr.split(':').map(s => s.split(',').map(parseFloat));
        knot.crossings = crossStr.split(':').map(s => Crossing.deserialize(s));
        knot.makeConnect();
        return knot;
    }
    addPointActual(x, y) {
        this.points.push([x, y]);
        if (this.func) {
            this.targets.push(this.func(x, y));
        }

        if (this.points.length === 1) {
            this.minX = x;
            this.maxX = x;
            this.minY = y
            this.maxY = y;
        } else {
            if (this.minX > x) {
                this.minX = x;
            }
            if (this.maxX < x) {
                this.maxX = x;
            }
            if (this.minY > y) {
                this.minY = y;
            }
            if (this.maxY < y) {
                this.maxY = y;
            }
        }
    }
    addPoint(x, y) {
        let d = 0;
        let lPo = this.points.length;
        if (lPo > 0) {
            let i = this.points[lPo - 1];
            if (x === i[0] && y === i[1]) {
                return;
            }
            d = Math.sqrt(sumSqr(x - i[0],y - i[1]));
            if (d < 0.001) {
                return;
            }
        }

        if (d > rad) {
            const nParts = d / rad;
            const lp = this.points[lPo - 1];
            for (let iPart = 1; iPart < nParts - 1; iPart++) {
                const t = iPart /nParts;
                const j = [x * t + lp[0] * (1 - t), y * t + lp[1] * (1 - t)];
                this.addPointActual(j[0], j[1]);
                this.calcCrossings();
            }
        }
        this.addPointActual(x, y);
        this.calcCrossings();
    }
    whichConnection(x, y) {
        console.log(`in which x = ${x} y = ${y}`)
        this.crossings.forEach((c, ic) => console.log(`${ic} -> ${c.x}, ${c.y}`));

        return this.crossings.findIndex(c => c.isInside(x, y));
    }
    invertConnections() {
        this.crossings.forEach(c => c.invert());
        this.countCrossings();
    }
    setConnectionInFocus(iCon) {
        console.log(`setConnectionInFocus ${iCon}`);
        this.conFocus = iCon;
    }
    setFocusConType(type) {
        if (this.conFocus >= 0 && this.conFocus < this.crossings.length) {
            this.crossings[this.conFocus].type = type;
        }
    }
    calcIntersect(index1, index2) {
        let ps = this.points;
        let [p0_x, p0_y] = [ps[index1][0], ps[index1][1]];
        let [p1_x, p1_y] = [ps[index1 + 1][0], ps[index1 + 1][1]];
        let [p2_x, p2_y] = [ps[index2][0], ps[index2][1]];
        let [p3_x, p3_y] = [ps[index2 + 1][0], ps[index2 + 1][1]];
        let s1_x = p1_x - p0_x;
        let s1_y = p1_y - p0_y;
        let s2_x = p3_x - p2_x;
        let s2_y = p3_y - p2_y;

        let s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
        let t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            let x = p0_x + (t * s1_x);
            let y = p0_y + (t * s1_y);
            return[x, y];
        }
        return null;
    }

    makeTarget(func) {
        let lPo = this.points.length;
        if (lPo === 0) {
            return;
        }
        this.func = func;
        this.targets = this.points.map(p => this.func(p[0], p[1]))
    }

    calcCrossings() {
        if (this.points.length > 2) {
            let l = this.points.length;
            let lastEdge = [this.points[l - 2], this.points[l - 1]];
            this.points.forEach((p, ip, ap) => {
                if ((ip < ap.length - 3) &&
                    isCrossing(lastEdge, [p, ap[ip + 1]])
                ) {
                    let intersect =this.calcIntersect(l - 2, ip)
                    if (intersect) {
                        this.crossings.push(new Crossing(...intersect, 1));
                    }
                }
            });
        }
    }
    countCrossings() {
        this.nPositiveCross = this.crossings.filter(cr => cr.type === 1).length;
    }
    actOnCrossing(x, y) {
        this.crossings.forEach(c => c.action(x, y));
        this.countCrossings();
    }

    drawList(ctx, tr, opt = {}) {
        console.log(`DrawList ${this.points.length}`);
        if (this.points.length <= 0) {
            return;
        }
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(...tPoint(this.points[0], tr));
        this.points.forEach(p => ctx.lineTo(...tPoint(p, tr)));
        ctx.stroke();

        if (this.targets.length <= 0) {
            return;
        }
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(...tPoint(this.targets[0], tr));
        this.targets.forEach(p => ctx.lineTo(...tPoint(p, tr)));
        ctx.stroke();
        //this.crossings.forEach((c, ic) => c.drawCrossing(ctx, this.points, tr,
        //    {...opt, typeOverride: opt.types ? opt.types[ic] : null }));
    }
    getLoopsCount(types) {
        this.nLoops = 0;
        this.crossings.forEach(c => c.pNear.forEach(n => { n[2] = -1; }));
        this.crossings.forEach((c, ic, ac) =>  {
            let type = typeByOpt(c.type, {typeOverride: types[ic]});
            let lines = linesByType(type);
            [0, 1, 2, 3].forEach(iN => {
                if (c.pNear[iN][2] < 0) {
                    c.pNear[iN][2] = this.nLoops;
                    let nc = c.pNear[nearInLine(lines, iN)];
                    nc[2] = this.nLoops;
                    type = typeByOpt(ac[nc[0]].type, {typeOverride: types[nc[0]]});
                    lines = linesByType(type);
                    while (ac[nc[0]].pNear[nc[1]][2] < 0) {
                        ac[nc[0]].pNear[nc[1]][2] = this.nLoops;
                        nc = ac[nc[0]].pNear[nearInLine(lines, nc[1])];
                        nc[2] = this.nLoops;
                        type = typeByOpt(ac[nc[0]].type, {typeOverride: types[nc[0]]});
                        lines = linesByType(type);
                    }
                    this.nLoops += 1;
                }
            })
        })
        return this.nLoops;
    }
}
