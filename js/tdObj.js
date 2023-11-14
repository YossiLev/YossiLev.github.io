class tdPos {
    constructor(x, y, r, t) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.t = t;
    }
    static PosXY(x, y) {
        return new tdPos(x, y, 0, 0);
    }
    static PosXYRT(x, y, r, t) {
        return new tdPos(x, y, r, t);
    }
    get pos() {
        return [this.x + this.r * Math.cos(this.t), this.y + this.r * Math.sin(this.t)];
    }
    getShifted(oPos) {
        const v = this.pos;
        const vs = oPos.pos;
        return [v[0] + vs[0], v[1] + vs[1]];
    }
    shift(x, y) {
        this.x += x;
        this.y += y;
    }
    static rad(t) {
        return t / 180.0 & Math.PI;
    }
}

const tdObjLine = 1;
const tdObjArc = 2;
const tdObjEllipse = 3;
const tdObjRect = 4;
const tdObjCoordinates = 10;
const tdObjHyperGeometric = 12;

const calcHyperGeometric = (a, b, c, z, n) => {
    let y = 1, r = 1;
    let ra = a, rb = b, rc = c, rz = 1;
    for (let i = 1; i < n; i++) {
        r *= ra * rb * z / (rc * i);
        y += r;
        ra++; rb++; rc++;
    }
    return y;
}

class tdObj {
    constructor(typ, params, pos) {
        this.typ = typ;
        this.params = params;
        this.pos = pos;
    }
    deepCopy() {
        return JSON.parse(JSON.stringify(this));
    }
    draw(ctx, ctxT) {

        switch (this.typ) {
            case tdObjLine:
                ctx.beginPath();
                ctx.moveTo(...this.pos.pos);
                ctx.lineTo(...this.pos.getShifted(this.params));
                ctx.stroke();
                break;
            case tdObjArc:
                ctx.beginPath();
                ctx.arc(...this.pos.pos, ...this.params);
                ctx.stroke();
                break;
            case tdObjEllipse:
                ctx.beginPath();
                ctx.ellipse(...this.pos.pos, ...this.params);
                ctx.stroke();
                break;
            case tdObjCoordinates:
                ctx.beginPath();
                tdObj.m(-100, 0, ctxT);
                tdObj.l(100, 0, ctxT);
                tdObj.m(0, -10000, ctxT);
                tdObj.l(0, 10000, ctxT);
                ctx.stroke();
                break;
            case tdObjHyperGeometric:
                let [a, b, c, xs, xe, st] = this.params;
                ctx.beginPath();
                for (let x = xs; x < xe; x += st) {
                    const y = calcHyperGeometric(a, b, c, x, 20);
                    if (x === xs) {
                        tdObj.m(x, y, ctxT);
                    } else {
                        tdObj.l(x, y, ctxT);
                    }
                }
                ctx.stroke();
                break;
        }
    }
    static m(x, y, t) {
        let [ctx, sx, sy, zx, zy, h] = t;
        ctx.moveTo(sx + x * zx, h - (sy + zy * y));
    }
    static l(x, y, t) {
        let [ctx, sx, sy, zx, zy, h] = t;
        ctx.lineTo(sx + x * zx, h - (sy + zy * y));
    }
    shift(x, y) {
        this.pos.shift(x, y);
    }
    static buildCoordinates() {
        return new tdObj(tdObjCoordinates, [], tdPos.PosXY(0, 0));
    }
    static buildLine(x1, y1, x2, y2) {
        return new tdObj(tdObjLine, tdPos.PosXY(x2 - x1, y2 - y1), tdPos.PosXY(x1, y1));
    }
    static buildLineRT(x1, y1, r, t) {
        return new tdObj(tdObjLine, tdPos.PosXYRT(0, 0, r, t), tdPos.PosXY(x1, y1));
    }
    static buildArc(x, y, r, t1, t2) {
        return new tdObj(tdObjArc, [r, t1, t2], tdPos.PosXY(x, y));
    }
    static buildEllipse(x, y, rx, ry, rot, t1 = 0, t2 = Math.PI * 2) {
        return new tdObj(tdObjEllipse, [rx, ry, rot, t1, t2], tdPos.PosXY(x, y));
    }
    static buildHyperGeometric(a, b, c, xs, xe, st) {
        return new tdObj(tdObjHyperGeometric, [a, b, c, xs, xe, st], tdPos.PosXY(0, 0));
    }
}

const tdAnimShift = 1;

class tdAnimation {
    constructor(name, typ, params) {
        this.name = name;
        this.typ = typ;
        this.params = params;
    }
}

const tdUiButton = 1;
const tdUiSlider = 2;

class tdUI {
    constructor(name, typ, params) {
        this.name = name;
        this.typ = typ;
        this.params = params;
        this.trans = [0, 0, 1, 1];
    }
}

class tdWorld {
    constructor() {
        this.clear();
    }
    clear() {
        this.objects = [];
        this.animations = [];
    }
    setTrans(sx, sy, zx, zy) {
        this.trans = [sx, sy, zx, zy];
    }
    clone(n, nn) {
        const oc = this.objects.find(o => o.name === n);
        if (oc) {
            const ocClone = JSON.parse(JSON.stringify(oc));
            ocClone.name = nn;
            this.objects.push(ocClone);
        }
    }
    static setStyle(ctx, style) {
        ctx.strokeStyle = style.color ? style.color : "black";
        ctx.lineWidth = style.width ? style.width : 1;
    }
    static drawObject(o, ctx, ctxT) {
        tdWorld.setStyle(ctx, o.style);
        o.obj.draw(ctx, ctxT);
    }
    draw(ctx) {
        let ctxT = [ctx, ...this.trans, ctx.canvas.height];
        this.objects.forEach(o => tdWorld.drawObject(o, ctx, ctxT));
    }
    drawC(ctx) {
        const can = ctx.canvas;
        ctx.clearRect(0, 0, can.width, can.height);
        this.draw(ctx);
    }
    push(o, style = {}, name = '', parent = null) {
        this.objects.push({obj: o, style: style, name: name, parent: parent});
    }
    shift(x, y) {
        this.objects.forEach(o => o.obj.shift(x, y));
    }
}
