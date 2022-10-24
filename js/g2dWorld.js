let single2dWorld = null;

class g2dWorld {
    static allWorlds = [];
    constructor(canvas, charges, currentTime, measurePoints) {
        const ctx = canvas.getContext("2d");
        this.resetView();
        this.setFocus();
        this.charges = charges;
        this.currentTime = currentTime;
        this.measurePoints =measurePoints;
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = ctx.canvas.width;
        this.h = ctx.canvas.height;
        this.toScreen = (p) => {
            const v = this.view_matrix;
            const px = [
                v[0] * p[0] + v[1] * p[1] + v[2] * p[2] + v[3],
                v[4] * p[0] + v[5] * p[1] + v[6] * p[2] + v[7],
            ];
            return [ctx.canvas.width / 2 + px[0] - 250, ctx.canvas.height / 2 - px[1] + 250];
        }

        g2dWorld.allWorlds.push(this);
    }
    setFocus() {
        single2dWorld = this;
    }
    static setFocusByCanvas2D(canvas) {
        let iWorld = g2dWorld.allWorlds.findIndex(w => w.canvas === canvas);
        if (iWorld >= 0) {
            g2dWorld.allWorlds[iWorld].setFocus();
        }
    }
    addLabelView(label, view, init = false) {
        this.labelViews.push({label, view, init})
    }
    activateView(label, setInFocus = true) {
        const lv = this.labelViews.find(lv => lv.label === label);
        if (!lv) {
            return;
        }
        if (setInFocus) {
            this.canvas.focus();
            this.setFocus();
        }
    }

    resetView() {
        this.view_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0, 0, 0,1 ];
    }

    prepare() {

        /*==================== MATRIX ====================== */

        this.resetView()

        /*================= Mouse events ======================*/
        this.drag = false;
        this.dragButton = - 1;
        this.old_x = 0;
        this.old_y = 0;
        this.dX = 0
        this.dY = 0;

        const mouseDown = function(e) {
            if (single2dWorld?.canvas === e.target) {
                const curWorld = single2dWorld;
                curWorld.drag = true;
                curWorld.dragButton = e.buttons;
                curWorld.old_x = e.pageX; curWorld.old_y = e.pageY;
                //e.preventDefault();
                return false;
            }
        };

        const mouseUp = function(e){
            if (single2dWorld?.canvas === e.target) {
                const curWorld = single2dWorld;
                curWorld.drag = false;
            }
        };

        const mouseMove = function(e) {
            if (single2dWorld?.canvas === e.target) {
                const curWorld = single2dWorld;
                if (!curWorld.drag) return false;
                curWorld.dX = (e.pageX - curWorld.old_x);//*2*Math.PI/curWorld.canvas.width,
                curWorld.dY = (e.pageY - curWorld.old_y);//*2*Math.PI/curWorld.canvas.height;

                if (curWorld.dragButton == 1) { // left button
                    let rd = curWorld.dY * curWorld.dY + curWorld.dX * curWorld.dX;
                    if (rd > 0.001) {
                        rd = 1.0 / Math.sqrt(rd);
                        let axis = [-curWorld.dY * rd, -curWorld.dX * rd, 0, 1.0];
                        let r = mat4FromAxisAngle(axis, 0.005 / rd);
                        curWorld.view_matrix = multMat4x4(curWorld.view_matrix, r);
                        curWorld.drawState(- 1);
                    }
                }

                if (curWorld.dragButton == 2) { // right button
                    let shift = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.2 * curWorld.dX, -0.2 * curWorld.dY, 0, 1];
                    curWorld.view_matrix = multMat4x4(curWorld.view_matrix, shift);
                    curWorld.drawState(- 1);
                }

                curWorld.old_x = e.pageX;
                curWorld.old_y = e.pageY;
                e.preventDefault();
            }
        };

        const mouseDblClick = (e) => {
            if (single2dWorld?.canvas === e.target) {
                const curWorld = single2dWorld;
                curWorld.resetView();
                curWorld.drawState(- 1);
            }
        }

        const mouseWheel = function(e) {
            console.log("mouseWheel");
            if (single2dWorld?.canvas === e.target) {
                const curWorld = single2dWorld;
                e.wheel = e.deltaY ? -e.deltaY : e.wheelDelta / 40;
                let z = e.deltaY;
                if (z != 0) {
                    let b = 0;
                    if (z > 0) {
                        b = 1.003
                    } else {
                        b = 0.997
                        z = -z;
                    }
                    z = z / 10
                    zoomVecs(curWorld.view_matrix, Math.pow(b, z));
                    curWorld.drawState(- 1);
                    for (let i = 0; i < z; i++) {
                        curWorld.ZOOM = curWorld.ZOOM * b
                    }
                }
                e.preventDefault();
            }
        };

        this.canvas.addEventListener("mousedown", mouseDown, false);
        this.canvas.addEventListener("mouseup", mouseUp, false);
        this.canvas.addEventListener("mouseout", mouseUp, false);
        this.canvas.addEventListener("mousemove", mouseMove, false);
        this.canvas.addEventListener("onwheel" in document ? "wheel" : "mousewheel", mouseWheel, false)
        this.canvas.addEventListener("contextmenu", event => event.preventDefault());
        this.canvas.addEventListener("dblclick", mouseDblClick, false);
    }


    drawLine(from, to, col) {
        const ctx = this.ctx;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(...this.toScreen(from));
        ctx.moveTo(...this.toScreen(from));
        ctx.lineTo(...this.toScreen(to));
        ctx.stroke();
    }

    drawCircle(center, radius, col) {
        const ctx = this.ctx;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(...this.toScreen(center), radius, 0, 2 * Math.PI, false);
        ctx.fill();
    }

    drawState(curTime) {
        if (curTime >= 0) {
            this.currentTime = curTime;
        } else {
            console.log({tr: this.view_matrix});
        }
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
        this.drawLine([-1000, 0, 0], [1000, 0, 0], "yellow");
        ctx.strokeStyle = "green";
        drawFunc(this, this.charges[0], 0, 100);
        for (let measurePoint of this.measurePoints) {
            //this.drawCircle(measurePoint, 2, "red");
            const speedC = 90; // pixels per second
            const retTime = getRetardedTime(measurePoint, this.currentTime, speedC, this.charges[0]);
            const fnValues = this.charges[0](retTime);
            //this.drawLine(measurePoint, fnVals.p, "gray");
            const [eF, bF] = calcElectromagneticField(measurePoint, retTime, fnValues, speedC);
            this.drawLine(measurePoint, addVec3(eF, measurePoint), "blue");
            this.drawLine(measurePoint, addVec3(bF, measurePoint), "red");
        }
        const o = this.charges[0](this.currentTime);
        this.drawCircle(o.p, 4, "red");
    }

}
