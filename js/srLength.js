const srLengthStep = new Map();
const srLengthCanvasClick = (el, click) => {
    if (click === 0) {
        srLengthStep.set(el.id, click);
        return;
    }
    click += srLengthStep.get(el.id);
    srLengthStep.set(el.id, click);
    const ctx = el.getContext('2d');
    switch (el.id) {
        case "speedEllipse":
            ctx.fillStyle = 'blue';
            ctx.fillRect(10 + 40 * (click % 8), 10+ 40 * Math.floor(click / 8),  30, 30);
            break;
    }
}

const srLengthInit = () => {
    let vs = document.getElementsByClassName("activity")
    for (let item in vs) {
        if (vs.hasOwnProperty(item)) {
            srLengthCanvasClick(vs[item], 0)
            vs[item].onclick = (e) => {e.preventDefault(); srLengthCanvasClick(vs[item], 1)};
        }
    }
}

const clickAction = (e, el, action) => {
    eval(`clickAction_${el.id}`)(e, el, action)
}
let speedEllipseWorld;
const speedEllipseWorldInit = () => {
    let w = new tdWorld();
    let x = 200;
    let y = 200;
    let r = 100;
    let n = 32;
    const l = 50;
    w.push(tdObj.buildArc(x, y, r, 0,  Math.PI * 2), "orange");
    for (let i = 0; i < n; i++) {
        const t = i / n * Math.PI * 2;
        const tp = t - Math.PI / 2;
        w.push(tdObj.buildLineRT(x + r * Math.cos(tp), y + r *  Math.sin(tp), l, t), "blue");
    }
    return w;
}
const clickAction_speedEllipse = (e, el, action) => {
    console.log(e);
    const ctx = el.getContext('2d');
    switch (action) {
        case "init":
            speedEllipseWorld = speedEllipseWorldInit();
            speedEllipseWorld.drawC(ctx);
            break;
        case "main":
            speedEllipseWorld.shift(0, 8);
            speedEllipseWorld.drawC(ctx);
            break;
    }
}

window.onloadFuncs.push(srLengthInit);
