class Torus {
	static p(a, exp_eta, theta, psi) {
		let den = a / (0.5 * (exp_eta + 1 / exp_eta) - Math.cos(theta))
		return [0.5 * (exp_eta - 1 / exp_eta) * Math.cos(psi) * den, 
				0.5 * (exp_eta - 1 / exp_eta) * Math.sin(psi) * den,
				Math.sin(theta) * den]
	}
}
class glBuild {
	static lineList = [];
	static doIt;
	static doItM;
	static dataInit(pos, glMode, options = {}) {
		return ({
			vertices: [], normals: [], colors: [], indices: [],
			pos: pos,
			trMatrix: buildRelativeMat(pos),
			glMode: glMode,
			...options
		});
	}
	static dataPush(data, v, n, c) {
		data.vertices.push(...v);
		data.normals.push(...n);
		data.colors.push(...c);
	}
	static makeClone(pos, clone) {
		return new glInfo(glBuild.dataInit(pos, 0, {clone: clone}));
	}
	static cube(size, pos, col) {
		let s = 0.5 * size
		let data = {
			vertices: [-s, -s, -s, 
						-s, -s, s, 
						-s, s, -s, 
						-s, s, s, 
						s, -s, -s, 
						s, -s, s,
						s, s, -s, 
						s, s, s, ],
			colors: [...col, ...col, ...col, ...col, ...col, ...col, ...col, ...col],
			indices: [0, 1, 2, 3, 2, 1,     0, 4, 1, 1, 4, 5,     0, 4, 2, 2, 4, 6, 
					  2, 6, 7, 2, 7, 3,     7, 6, 4, 7, 4, 5,     3, 7, 5, 3, 5, 1  ],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0004 //gl.TRIANGLES, 
		}
			
		return new glInfo(data);
	}
	static sphere(r, n, pos, col) {
		const vnSphereFunc = (r, p, t) => {
			return [[r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * Math.cos(t), r * Math.sin(t)],
				[Math.sin(p) * Math.cos(t), Math.cos(p) * Math.cos(t), Math.sin(t)]]
		}
		let data = glBuild.dataInit(pos, 0x0004 /*gl.TRIANGLES */);

		const dTheta = 10;
		const dPhi = 10;

		let needFirstTheta = true;
		let lastPhi = 0;
		let lastTheta = 0;
		for (let iTheta = -90; iTheta < 91; iTheta += dTheta) {
			let theta = (Math.PI * iTheta) / 180
			if (needFirstTheta) {
				needFirstTheta = false
				lastTheta = theta
				continue
			}

			let needFirstPhi = true
			for (let iPhi = -180; iPhi < 181; iPhi += dPhi) {
				let phi = (Math.PI * iPhi) / 180

				if (needFirstPhi) {
					needFirstPhi = false
					lastPhi = phi
					continue
				}

				let ll = data.vertices.length / 3;
				glBuild.dataPush(data, ...vnSphereFunc(r, phi, theta), col);
				glBuild.dataPush(data, ...vnSphereFunc(r, lastPhi, theta), col);
				glBuild.dataPush(data, ...vnSphereFunc(r, lastPhi, lastTheta), col);
				glBuild.dataPush(data, ...vnSphereFunc(r, phi, lastTheta), col);

				data.indices.push(ll, ll + 1, ll + 3, ll + 2, ll + 1, ll + 3)

				lastPhi = phi
			}
			lastTheta = theta
		}

		return new glInfo(data);

	}
	static torus(size, pos, col) {
		let s = 0.5 * size

		let data = glBuild.dataInit(pos, 0x0004 /*gl.TRIANGLES */);

		let eta = 2.9
		let exp_eta = Math.exp(eta)
		let needFirstTheta = true
		let last_psi = 0;
		let lastTheta = 0;
		let pRot = 0;
		let last_pRot = 0;
		for (let iTheta = -180; iTheta < 181; iTheta +=5) {
			let theta = (Math.PI * iTheta) / 180
			if (needFirstTheta) {
				needFirstTheta = false
				lastTheta = theta
				continue
			}

			let needFirstPsi = true
			for (let iPsi = -180; iPsi < 181; iPsi +=5) {
				let psi = (Math.PI * iPsi) / 180

				if (iPsi < 0) {
					pRot = -psi * 0.01;
				} else {
					pRot = psi * 0.01;
				}

				if (needFirstPsi) {
					needFirstPsi = false
					last_psi = psi
					last_pRot = pRot
					continue
				}

				let ll = data.vertices.length / 3;
				data.vertices.push(...Torus.p(s, exp_eta, theta + pRot, psi))
				data.vertices.push(...Torus.p(s, exp_eta, lastTheta + pRot, psi))
				data.vertices.push(...Torus.p(s, exp_eta, lastTheta + last_pRot, last_psi))
				data.vertices.push(...Torus.p(s, exp_eta, theta + last_pRot, last_psi))
				data.normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
				data.colors.push(...col, ...col, ...col, ...col)
				data.indices.push(ll, ll + 1, ll + 3, ll + 2, ll + 1, ll + 3)

				last_psi = psi
				last_pRot = pRot
			}
			lastTheta = theta
		}

		return new glInfo(data);
	}
	static floor(n, size) {
		let data = glBuild.dataInit([0, 0, 0, 0, 0, 0],0x0004 /*gl.TRIANGLES*/)
		let cols = [[0.1, 0.1, 0.1], [0.9, 0.9, 0.9]]
		for (let ix = -n; ix < n; ix++) {
			let x = ix * size;
			for (let iy = -n; iy < n; iy++) {
				let y = iy * size;
				let iCol = (ix + iy + 2 * n) % 2;

				let ll = data.vertices.length / 3;
				data.vertices.push(x, y, 0);
				data.vertices.push(x + size, y, 0);
				data.vertices.push(x + size, y + size, 0);
				data.vertices.push(x, y + size, 0);
				data.normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
				data.colors.push(...(cols[iCol]), ...(cols[iCol]), ...(cols[iCol]), ...(cols[iCol]));
				data.indices.push(ll, ll + 1, ll + 3, ll + 2, ll + 3, ll + 1);

			}
		}
		return new glInfo(data);
	}

	static curveFrame(func, p, lf = null) {
		const epsilon = 0.0001;
		const mv = func(p);
		const mvM = func(p - epsilon);
		const mvP = func(p + epsilon);
		const nVec = normalizeVec3([mvP[0] - mvM[0], mvP[1] - mvM[1], mvP[2] - mvM[2]]);
		let nVecS = [mvP[0] + mvM[0] - 2 * mv[0], mvP[1] + mvM[1] - 2 * mv[1], mvP[2] + mvM[2] - 2 * mv[2]];
		if (norm2Vec3(nVecS) < epsilon * epsilon * epsilon * epsilon * epsilon) {
			if (lf === null) {
				nVecS = nVec[2] > 0.05 ? [0, 1, 0] : [0, 0, 1];
			} else {
				return {...lf, pos: mv }
			}
		} else {
			nVecS = normalizeVec3(nVecS);
		}
		const nVec2 = normalizeVec3(multVec3(nVec, nVecS));
		const nVec3 = multVec3(nVec, nVec2);
		if (lf != null && multScalarVec3(nVec2, lf.norm1) < 0.4) {
			return {...lf, pos: mv }
		}

		return {pos: mv, norm1: nVec2, norm2: nVec3};
	}
	static surfaceFrame(func, p) {
		const epsilon = 0.001;
		const mv = func(p);
		const mvM = func(p - epsilon)[0];
		const mvP = func(p + epsilon)[0];
		const nVec = normalizeVec3(subVec3(mvP, mvM));
		const nVec2 = normalizeVec3(mv[1]);
		const nVec3 = normalizeVec3(multVec3(nVec, nVec2));
		return {pos: mv[0], norm1: nVec2, norm2: nVec3};
	}

	static helixCurve(d, r, n, width, pos, col, colorFunc = null) {
		const helixFunc = (pa) => [r * Math.cos(pa * n * Math.PI * 2), r * Math.sin(pa * n * Math.PI * 2), pa * n * d];
		return glBuild.parametricCurve((p) => glBuild.curveFrame(helixFunc, p), 50 * n, width, pos, col, colorFunc);
	}
	static segmentCurve(p1, p2, width, pos, col, colorFunc = null) {
		const segmentFunc = (pa) => {
			let rc = p1.map((p, ip) => (1 - pa) * p + pa * p2[ip]);
			return rc;
		}
		return glBuild.parametricCurve((p) => glBuild.curveFrame(segmentFunc, p), 1, width, pos, col, colorFunc);
	}
	static sineCurve(width, pos, col) {
		const sineFunc = (pa) => [0.03 * pa * Math.PI * 2, 0, 0.1 * Math.sin(pa * Math.PI * 2)];
		return glBuild.parametricCurve((p) => glBuild.curveFrame(sineFunc, p), 50, width, pos, col);
	}
	static sineCurve2(width, pos, col, colorFunc = null) {
		return glBuild.parametricCurve((p, t, r) => {
			const a = p * Math.PI * 2;
			const mv = [a, 0, Math.sin(a)];
			const nVec = normalizeVec3([1, 0, Math.cos(a)]);
			const nVec2 = [0, 1, 0];
			const nVec3 = multVec3(nVec, nVec2);
			return mv.map((v, iv) => 0.1 *(v + nVec2[iv] * Math.sin(t) * r + nVec3[iv] * Math.cos(t) * r));
		}, 50, width, pos, col, colorFunc);
	}
	static arc3dCurve(r, phi, t1, t2, width, pos, col, colorFunc = null) {
		const arc3dFunc = (pa) => {
			const t = t1 * pa + t2 * (1 - pa);
			return [r * Math.cos(t) * Math.sin(phi), r * Math.cos(t) * Math.cos(phi), r * Math.sin(t)];
		};
		return glBuild.parametricCurve((p) => glBuild.curveFrame(arc3dFunc, p), 250, width, pos, col, colorFunc);
	}
	static getFreeFallFunction(x, v, a, time) {
		return (pa) => {
			pa *= time;
			return [Math.max(0, x + v * pa + 0.5 * a * pa * pa), 0, 0];
		};
	}
	static freeFallSpaceTimeCurve(x, v, a, time, width, pos, col, colorFunc = null) {
		let freeFunc = glBuild.getFreeFallFunction(x, v, a, time);
		const fallCurve = (pa) => {
			let pos = freeFunc(pa);
			pos[2] = pa * time * 0.1;
			return pos;
		}
		return glBuild.parametricCurve((p, lf) => glBuild.curveFrame(fallCurve, p, lf), 100, width, pos, col, colorFunc);
	}

	static ellipseSpaceTimeCurve(rx, ry, time, width, pos, col, colorFunc = null) {
		let ellipseFunc = glBuild.getEllipseFunction(rx, ry);
		const ellipseCurve = (pa) => {
			let pos = ellipseFunc(pa);
			pos[2] = pa * time * 0.1;
			return pos;
		}
		return glBuild.parametricCurve((p, lf) => glBuild.curveFrame(ellipseCurve, p, lf), 100, width, pos, col, colorFunc);
	}

	static getEllipseFunction(rx, ry) {
		class ellTime {
			constructor(e) {
				this.f = [];
				const a = Math.sqrt((1 - e) / (1 + e));
				const b = e * Math.sqrt(1 - e * e);
				for (let th = 0.0; th < Math.PI - 0.2; th = th + 0.1) {
					this.f.push(
						{
							th: th,
						    time: 2 * Math.atan(a * Math.tan(th/ 2)) - b * Math.sin(th) / (1 + e * Math.cos(th))
						});
				}
				this.f.push({ th: Math.PI, time: Math.PI });
			}
			getTheta(time) {
				while (time > Math.PI) {
					time -= 2 * Math.PI;
				}
				while (time < - Math.PI) {
					time += 2 * Math.PI;
				}
				let sign = time >= 0 ? 1 : - 1;
				time = time * sign;
				let mMin = 0;
				let mMax = this.f.length - 1;
				while (mMax > mMin + 1) {
					let mMid = Math.trunc((mMax + mMin) / 2);
					if (this.f[mMid].time > time) {
						mMax = mMid;
					} else {
						mMin = mMid;
					}
				}
				let u = (time - this.f[mMin].time) / (this.f[mMax].time - this.f[mMin].time)
				let theta = ((1 - u) * this.f[mMin].th + u * this.f[mMax].th) * sign;
				if (theta < 0) {
					theta += 2 * Math.PI;
				}
				return theta;
			}
		};
		const sign = rx > 0 ? 1 : -1;
		rx *= sign;
		const f = Math.sqrt(rx * rx  - ry * ry); // distance pf focal point from center
		const e = f / rx; // eccentricity
		let calcObj = new ellTime(e);
		return (pa) => {
			const t1 = pa * Math.PI * 2;
			if (e < 0.0001) {
				return [rx * Math.cos(t1), sign * rx * Math.sin(t1), 0];
			}
			const t = calcObj.getTheta(t1);
			const sig = t > Math.PI * 3 / 2 || t < Math.PI / 2 ? 1 : - 1; // sigh for picking quadratic solution
			const tant = Math.tan(t);
			const tantDry = tant / ry;
			// quadratic equation coefficients
			const a = 1 / (rx * rx) + tantDry * tantDry;
			const b = 2 * f / (rx * rx);
			const c = f * f / (rx * rx) - 1;
			let disc = b * b - 4 * a * c;
			let x = 0;
			let y = 0;
			if (disc >= 0)  {
				x = (- b + sig * Math.sqrt(disc)) / (2 * a);
				y = x * tant;
			}
			return [x, y * sign, 0];
		};
	}
	static ellipse(rx, ry, width, pos, col, colorFunc = null) {
		const pathFunc = glBuild.getEllipseFunction(rx, ry);

		const ellipseFrame = (pa) => {
			const pos = pathFunc(pa);
			const prevPos = pathFunc(pa - 0.0001);
			const dir = pos.map((p, ip) => 10000 * (p - prevPos[ip]));
			const v = Math.sqrt(1 / (Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1])));

			return {pos: pos, norm1: [0,0,1], norm2: normalizeVec3(multVec3([0,0,1], dir))};
		};
		return glBuild.parametricCurve(ellipseFrame, 50, width, pos, col, colorFunc);
	}

	static trefoilKnotCurve(width, pos, col, colorFunc = null) {
		const trefoilKnotFunc = (pa) => {
			const t = pa * Math.PI * 2;
			return [0.02 * (Math.cos(t) + 2 * Math.cos(2 * t)), 0.02 * (Math.sin(t) - 2 * Math.sin(2 * t)), 0.02 * (2 * Math.sin(3 * t))];
		};
		return glBuild.parametricCurve((p, lf) => glBuild.curveFrame(trefoilKnotFunc, p, lf), 250, width, pos, col, colorFunc);
	}

	static parametricCurve(func, n, width, pos, colx, colorFunc) {
		let data = glBuild.dataInit(pos,0x0004 /*gl.TRIANGLES*/, {func: func})

		let r = width;

		let last_p = 0;
		let lastTheta = 0;
		let lastFr = null;
		const colModulu = colx.length / 3;
		const colors = colx.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index / 3)
			if(!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = [];
			}
			resultArray[chunkIndex].push(item);
			return resultArray;
		}, [])

		let needFirstP = true
		for (let ip = 0; ip <= n; ip++) {

			let p = ip / n;
			let color = [...colors[ip % colModulu]];
			if (colorFunc) {
				color = [...colorFunc(p)];
			}
			//console.log('b1', lastFr);
			let fr = func(p, lastFr);
			if (needFirstP) {
				needFirstP = false
				last_p = p
				lastFr = fr;
				continue
			}
			const subDiv = Math.floor(distVec3(fr.pos, lastFr.pos) / 0.015) + 1;

			for (let is = 1; is <= subDiv; is++) {
				let ps = last_p + 1 / (n * subDiv);
				if (subDiv !== 1) {
					//console.log('b2', lastFr);
					fr = func(ps, lastFr);
				}

				let needFirstTheta = true
				for (let iTheta = -180; iTheta < 181; iTheta += 30) {
					let theta = (Math.PI * iTheta) / 180;
					if (needFirstTheta) {
						needFirstTheta = false;
						lastTheta = theta;
						continue;
					}

					const p1t1 = fr.pos.map((v, iv) => v + fr.norm1[iv] * Math.sin(theta) * r + fr.norm2[iv] * Math.cos(theta) * r);
					const p1t0 = fr.pos.map((v, iv) => v + fr.norm1[iv] * Math.sin(lastTheta) * r + fr.norm2[iv] * Math.cos(lastTheta) * r);
					const p0t1 = lastFr.pos.map((v, iv) => v + lastFr.norm1[iv] * Math.sin(theta) * r + lastFr.norm2[iv] * Math.cos(theta) * r);
					const p0t0 = lastFr.pos.map((v, iv) => v + lastFr.norm1[iv] * Math.sin(lastTheta) * r + lastFr.norm2[iv] * Math.cos(lastTheta) * r);

					const surfaceNormal = [0, 1, 2].map(iv => fr.norm1[iv] * Math.sin(theta) + fr.norm2[iv] * Math.cos(theta));

					let ll = data.vertices.length / 3;
					data.vertices.push(...p1t1, ...p1t0, ...p0t0, ...p0t1);
					data.normals.push(...surfaceNormal, ...surfaceNormal, ...surfaceNormal, ...surfaceNormal);
					//if (iTheta > -180 + 30) {
						data.colors.push(...color, ...color, ...color, ...color);
				//	} else {
				//		data.colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
				//	}
					data.indices.push(ll, ll + 1, ll + 3, ll + 2, ll + 3, ll + 1);
					lastTheta = theta;
				}
				last_p = ps;
				lastFr = fr;
			}
		}

		return new glInfo(data);
	}
	static arrow(l, l2, r , r2, pos, col) {
		let data = glBuild.dataInit(pos,0x0004 /*gl.TRIANGLES*/)

		let lastTheta = 0;
		let lastFr = null;
		let surfaceNormal, p1t1, p1t0, p0t1, p0t0;

		for (let s = 0; s < 3; s++) {
			let needFirstTheta = true
			for (let iTheta = -180; iTheta < 181; iTheta += 10) {
				let theta = (Math.PI * iTheta) / 180;
				if (needFirstTheta) {
					needFirstTheta = false;
					lastTheta = theta;
					continue;
				}

				switch (s) {
					case 0:
						p1t1 = [Math.sin(theta) * r, Math.cos(theta) * r, l - l2];
						p1t0 = [Math.sin(lastTheta) * r, Math.cos(lastTheta) * r, l - l2];
						p0t1 = [Math.sin(theta) * r, Math.cos(theta) * r, 0];
						p0t0 = [Math.sin(lastTheta) * r, Math.cos(lastTheta) * r, 0];
						surfaceNormal = [Math.sin((lastTheta + theta) / 2), Math.cos((lastTheta + theta) / 2), 0];
						break;
					case 1:
						p1t1 = [Math.sin(theta) * r, Math.cos(theta) * r, l - l2];
						p1t0 = [Math.sin(lastTheta) * r, Math.cos(lastTheta) * r, l - l2];
						p0t1 = [Math.sin(theta) * r2, Math.cos(theta) * r2, l - l2];
						p0t0 = [Math.sin(lastTheta) * r2, Math.cos(lastTheta) * r2, l - l2];
						surfaceNormal = [0, 0, -1];
						break;
					case 2:
						p1t1 = [Math.sin(theta) * r2, Math.cos(theta) * r2, l - l2];
						p1t0 = [Math.sin(lastTheta) * r2, Math.cos(lastTheta) * r2, l - l2];
						p0t1 = [0, 0, l];
						p0t0 = [0, 0, l];
						surfaceNormal = normalizeVec3([r2, 0, l2]);
						surfaceNormal[1] = surfaceNormal[0] * Math.cos((lastTheta + theta) / 2);
						surfaceNormal[0] = surfaceNormal[0] * Math.sin((lastTheta + theta) / 2);
						break;
				}

				let ll = data.vertices.length / 3;
				data.vertices.push(...p1t1, ...p1t0, ...p0t0, ...p0t1);
				data.normals.push(...surfaceNormal, ...surfaceNormal, ...surfaceNormal, ...surfaceNormal);
				data.colors.push(...col, ...col, ...col, ...col);
				data.indices.push(ll, ll + 1, ll + 3, ll + 2, ll + 3, ll + 1);

				lastTheta = theta;

			}
		}

		return new glInfo(data);
	}
	static flatSurface(r1, pos, col) {
		const flatSurfaceFunc = (xm, xn) => [[r1 * (xm - 0.5), r1 * (xn - 0.5), 0],[0, 0, 1]];
		return glBuild.parametricSurface(flatSurfaceFunc, 40, 40, pos, col);
	}
	static sineSurface(r1, h, pos, col) {
		const sineSurfaceFunc = (xm, xn) => {
			const rc = [
				[	r1 * (xm - 0.5),
					r1 * (xn - 0.5),
					h * Math.sin(xm * Math.PI * 2) * Math.sin(xn * Math.PI * 2)],
				normalizeVec3([- h * Math.cos(xm * Math.PI * 2) * Math.sin(xn * Math.PI * 2),
					- h * Math.cos(xn * Math.PI * 2) * Math.sin(xm * Math.PI * 2), r1 * r1])
			];
			//glBuild.lineList.push([[rc[0][0], rc[0][1], rc[0][2]],
			//	[rc[0][0] + 0.01 * rc[1][0], rc[0][1] + 0.01 * rc[1][1], rc[0][2] + 0.01 * rc[1][2]]]);

			return rc;
		}

		return glBuild.parametricSurface(sineSurfaceFunc, 40, 40, pos, col);
	}
	static parametricSurface(vnFunc, m, n, pos, col) {
		let data = glBuild.dataInit(pos,0x0004 /*gl.TRIANGLES*/, {func: vnFunc});

		let pm = 0;
		let pn = 0;

		let needFirstM = true
		for (let im = 0; im <= m; im++) {
			let xm = im / m;
			if (needFirstM) {
				needFirstM = false;
				pm = xm;
				continue;
			}

			let needFirstN = true
			for (let iN = 0; iN <= n; iN++) {
				let xn = iN / n;
				if (needFirstN) {
					needFirstN = false;
					pn = xn;
					continue;
				}
				let ll = data.vertices.length / 3;
				let colX = ((im + iN) % 2 === 1) ? [...col] : [0, 0, 0];
				glBuild.dataPush(data, ...vnFunc(xm, xn), colX);
				glBuild.dataPush(data, ...vnFunc(xm, pn), colX);
				glBuild.dataPush(data, ...vnFunc(pm, pn), colX);
				glBuild.dataPush(data, ...vnFunc(pm, xn), colX);

				data.indices.push(ll, ll + 1, ll + 3, ll + 2, ll + 3, ll + 1);

				pn = xn;
			}
			pm = xm;
		}

		return new glInfo(data);
	}

	static curveOnSurface(surface, uStart, vStart, uStep, vStep, nSteps, col, width, colorFunc = null) {
		//*
		const curveFunc = (pa) => {
			const u = uStart + uStep * nSteps * pa;
			const v = vStart + vStep * nSteps * pa;
			const vec = surface.glPack.func(u, v);
			return vec;
		}
		return glBuild.parametricCurve((p) => glBuild.surfaceFrame(curveFunc, p), nSteps, width, surface.glPack.pos, col, colorFunc);
		/*/

		console.log(surface)
		let data = glBuild.dataInit(surface.glPack.pos,0x0001 );

		const func = surface.glPack.func;
		let lastP = func(uStart, vStart)[0];
		for (let iStep = 1; iStep < nSteps; iStep++) {
			let p = func(uStart + iStep * uStep, vStart + iStep * vStep)[0];
			glBuild.addLine(data, lastP, p, col, width);
			lastP = p;
		}

		return new glInfo(data);
		 //*/
	}

	static getDistanceByAngle(func, uv, vec3, epsilon, t) {
		const u = uv[0] + epsilon * Math.cos(t);
		const v = uv[1] + epsilon * Math.sin(t);
		//console.log(u, v);
		const f = func(u, v);
		if (glBuild.doIt) {
			glBuild.lineList.push([[f[0][0], f[0][1], f[0][2]], [f[0][0] + 0.1 * f[1][0], f[0][1] + 0.1 * f[1][1], f[0][2] + 0.1 * f[1][2]]]);
		};
		let d = distanceBetweenTwo3dLines(vec3, [...f[0],...f[1]]);
		//console.log(d, ' <- ', [...f[0],...f[1]], vec3);
		return d;
	}
	static getGeodesicUV(func, uv, puv, vec3, epsilon) {
		glBuild.doIt = false;
		const n = 50;
		const pi = Math.PI / 4 / n;
		let minD = 99999;
		let bestT, bestI;
		let angle = Math.atan2(uv[1] - puv[1], uv[0] - puv[0]) - Math.PI / 8;
		//console.log('========= ', angle * 180 / Math.PI, uv[1] - puv[1], uv[0] - puv[0]);
		for (let it = 0; it <= n; it ++) {
			const t = angle + it * pi;
			const d = glBuild.getDistanceByAngle(func, uv, vec3, epsilon, t);
			//console.log(it, (t * 180 / Math.PI).toFixed(1), d);
			if (minD > d) {
				minD = d;
				bestT = t;
				bestI = it;
			}
		}
		let maxT2;
		if (Math.abs(bestI - n / 2) > 10) {
			let minD = 99999;
			glBuild.doIt = glBuild.doItM && glBuild.lineList.length === 0;
			for (let it = 0; it <= n; it ++) {
				const t = angle + it * pi;
				const d = glBuild.getDistanceByAngle(func, uv, vec3, epsilon, t);
				console.log(it, (t * 180 / Math.PI).toFixed(1), d);
				if (minD > d) {
					minD = d;
					bestT = t;
					bestI = it;
				}
			}
			glBuild.doIt = false;
		}
		/*
		let dev = pi2;
		if (glBuild.getDistanceByAngle(func, uv, vec3, epsilon, maxT + dev) >
			glBuild.getDistanceByAngle(func, uv, vec3, epsilon, maxT - dev)) {
			maxT2 = maxT - dev;
		} else {
			maxT2 = maxT + dev;
		}
		*/

		const minD1 = glBuild.getDistanceByAngle(func, uv, vec3, epsilon, bestT - pi);
		const minD2 = glBuild.getDistanceByAngle(func, uv, vec3, epsilon, bestT + pi);

		const x1 = bestT - pi / 2;
		const x2 = bestT + pi / 2;
		const y1 = minD - minD1;
		const y2 = minD2 - minD;

		const finalT = x1 - y1 * (x2 - x1) / (y2 - y1);

		//console.log('bestI ', bestI, (bestT * 180 / Math.PI).toFixed(4), (finalT * 180 / Math.PI).toFixed(4), minD, minD1, minD2)
		return [uv[0] + epsilon * Math.cos(finalT), uv[1] + epsilon * Math.sin(finalT)]
	}

	static geodesicOnSurface(surface, uStart, vStart, uDirection, vDirection, length, col, width, colorFunc = null) {
		const func = surface.glPack.func;
		let uv = [uStart, vStart];
		let path = [], vec;
		let p0 = func(uStart, vStart)[0];
		let p1 = func(uStart + uDirection, vStart + vDirection)[0];
		let puv = [uStart - uDirection, vStart - vDirection]
		for (let ii = 0; ii < 1000; ii++) {
			glBuild.doItM = ii > 10;
			path.push(uv);
			let vec = p0.map((pp0, i) => p1[i] - pp0);
			//console.log('@@@@@@@ ', [...p0, ...vec]);
			let nuv = glBuild.getGeodesicUV(func, uv, puv,[...p0, ...vec], 0.001);
			puv = [...uv];
			uv = [...nuv];
			if (uv[0] < 0.0 || uv[0] > 1.0 || uv[1] < 0.0 || uv[1] > 1.0) {
				break;
			}
			//console.log('uv ', uv[0].toFixed(4), uv[1].toFixed(4));
			p0 = p1;
			p1 = func(...uv)[0];
		}
		//console.log(path);
		const lPath = path.slice(1).map((p, ip) =>
			Math.sqrt((path[ip][0] - path[ip + 1][0]) * (path[ip][0] - path[ip + 1][0]) +
				(path[ip][1] - path[ip + 1][1]) * (path[ip][1] - path[ip + 1][1])));
		//console.log(lPath);
		const sPath = [0];
		lPath.forEach((p, ip) => sPath.push(sPath[ip] + p));
		const sPathTot = sPath[sPath.length - 1];
		//console.log(sPath);

		const curveFunc = (pa) => {
			const pos = pa * sPathTot;
			let seg = sPath.findIndex(s => s >= pos);
			if (seg < 0) {
				seg = path.length - 1;
			}
			//console.log(pos, seg);
			const part = (pos - sPath[seg - 1]) / (sPath[seg] - sPath[seg - 1]);
			const u = seg === 0 ? path[0][0] : path[seg - 1][0] * (1 - part) + path[seg][0] * part;
			const v = seg === 0 ? path[0][1] : path[seg - 1][1] * (1 - part) + path[seg][1] * part;
			const vec = surface.glPack.func(u, v);
			return vec;
		}
		return glBuild.parametricCurve((p) => glBuild.surfaceFrame(curveFunc, p), 400, width, surface.glPack.pos, col, colorFunc);
	}

	static addLine(data, p1, p2, c, w = 1) {
		let ll = data.vertices.length / 3
		data.vertices.push(...p1, ...p2);
		data.normals.push(0, 0, 1, 0, 0, 1);
		data.colors.push(...c, ...c);
		data.indices.push(ll, ll + 1);
		data.width = w;
	}
	static addFrame() {
		glBuild.addLine(data, [0, 0, 0], [2, 0, 0], [1, 0, 0], 6);
		glBuild.addLine(data, [0, 0, 0], [0, 2, 0], [0, 1, 0], 6);
		glBuild.addLine(data, [0, 0, 0], [0, 0, 2], [0, 0, 1], 6);
	}

	static listOfLine(pos, col) {
		let data = glBuild.dataInit(pos,0x0001 /*gl.LINES*/);

		glBuild.lineList.forEach(l => {
			glBuild.addLine(data, l[0], l[1], col)
		});

		glBuild.lineList = [];
		return new glInfo(data);
	}
	static diracLines(size, pos, col) {
		let s = 0.5 * size
		let data = glBuild.dataInit(pos,0x0001 /*gl.LINES*/, {cylSymmetry: 20});

		let dx, dy, dz, dx1, dx2, dy1, dy2, r;
		dz = 0;
		let res = 0.04
		for (let x = res; x < 2; x += res) {
			dx1 = Math.exp(- x * x);
			dy1 = x * Math.exp(- x * x);
			for (let y = 0; y < res / 2; y += res) {
				dx2 = - dx1 * y * Math.exp(- y * y);
				dy2 = dy1 * Math.exp(- y * y);
				for (let z = - 2; z < 2; z += res) {
					dx = dx2 * Math.exp(- z * z);
					dy = dy2 * Math.exp(- z * z);
					r = dx * dx + dy * dy;
					if (r > 0.001) {
						let ll = data.vertices.length
						let zm = 2000 * r * r * r * r *  r
						data.vertices.push(x, y, z, x + dx * zm, y + dy * zm, z + dz * zm);
						data.normals.push(0, 0, 1, 0, 0, 1);
						data.colors.push(...col,  0, 0, 0);
						let ind = [ll, ll + 1]  
						data.indices.push(...ind);						
					}
				}
			}
		}

		return new glInfo(data);
	}

	static electricField(charge, pos, n) {
		let data = glBuild.dataInit(pos,0x0001 /*gl.LINES*/, {sphereSymmetry: 10});

		let f = 0.6
		let colE = [1, 0, 0];
		
		for (let z = 0.1; z < 7; z += 0.05) {
			let s = 0.002 * charge / (z * z);
			if (s < 0.001) {
				break;
			}
			glBuild.addLine(data, [0, 0, z], [0, 0, z + s], colE)
		}

		return new glInfo(data);
	}
	
	static magneticField(charge, dipole, pos, n) {
		let data = glBuild.dataInit(pos,0x0001 /*gl.LINES*/, {cylSymmetry: 50});

		let f = 0.6
		let colB = [0, 0, 1];
		
		for (let x = 0.00; x < 1; x += 0.05) {
			let x2 = x * x;
			for (let z = - 1; z < 1; z += 0.05) {
				let zmd = z - dipole;
				let zpd = z + dipole;
				let dUp2 = x2 + zmd * zmd;   
				let dDown2 = x2 + zpd * zpd;   
				let nUp = 1 / Math.sqrt(dUp2)
				let nDown = 1 / Math.sqrt(dDown2)
				let sUp = 0.02 * charge / dUp2;
				let sDown = 0.02 * charge / dDown2;
				
				let sx = sUp * x * nUp - sDown * x * nDown;
				let sz = sUp * zmd * nUp - sDown * zpd * nDown;
				if (sx * sx + sz * sz > 0.0009) {
					let shrink = 0.03 / Math.sqrt(sx * sx + sz * sz);
					sx *= shrink;
					sz *= shrink;
				}

				glBuild.addLine(data, [x - 0.5 * sx, 0, z - 0.5 * sz], [x + 0.5 * sx, 0, z + 0.5 * sz], colB)
			}
		}

		return new glInfo(data);
	}
	
	
	static emWaves(kVec, epsilonVec, pos, n) {
		let data = glBuild.dataInit(pos,0x0001 /*gl.LINES*/);

		let f = 0.6
		//glBuild.addLine(data, [0, 0, - 360  * Math.PI / 180.0 * n * f], [0, 0, 360  * Math.PI / 180.0 * n * f], [1, 0, 1])
		glBuild.addFrame();

		let k = kVec; //[1, 0, 0, 1]
		let pol = epsilonVec; //[Complex.bld(0, 0), Complex.bld(1, 0), Complex.bld(0, 1), Complex.bld(0, 0)];
		
		let oldA1 = [];
		let colA1 = [0, 0.5, 0];
		let oldA2 = [];
		let colA2 = [0, 0.5, 0.5];
		
		let oldE = [];
		let oldB = [];
		let colE = [1, 0, 0];
		let colB = [0, 0, 1];
		let colEnergy = [0.5, 0.5, 0]
		let potential = new emPotential(pol, k);
		
		let t = 0;
		for (let z = 0; z < 7; z += 0.1) {
			let vx = [t, 0, 0, z]
			//let a = potential.calcVal(vx)
			let ee = Complex.toReal(potential.calcE(vx))
			let bb =  Complex.toReal(potential.calcB(vx))

			//let tt = z;
			//let zz = tt * 0.6;
			//let x = Math.sin(tt) * 0.9;
			//let y = 0;//Math.cos(tt) * 0.9;
			
			let base = [0, 0, z];
			//let newA1 = [a[1].r, a[1].i, z];
			//let newA2 = [a[2].r, a[2].i, z];
			let newE = [ee[0], ee[1], z];
			let newB = [bb[0], bb[1], z];
			
			let energy = ee[0] * ee[0] + ee[1] * ee[1] + ee[2] * ee[2] + bb[0] * bb[0] + bb[1] * bb[1] + bb[2] * bb[2];
			
			glBuild.addLine(data, base, newE, colE)
			glBuild.addLine(data, base, newB, colB)
			glBuild.addLine(data, [0, 0, z], [0, Math.sqrt(energy), z], colEnergy)
			//glBuild.addLine(data, base, newA1, colA1)
			//glBuild.addLine(data, base, newA2, colA2)
			if (oldE.length > 2) {
				glBuild.addLine(data, oldE, newE, colE)
				glBuild.addLine(data, oldB, newB, colB)
				//glBuild.addLine(data, oldA1, newA1, colA1)
				//glBuild.addLine(data, oldA2, newA2, colA2)
			}
			
			oldE = [...newE];
			oldB = [...newB];
			//oldA1 = [...newA1];
			//oldA2 = [...newA2];
		}

		return new glInfo(data);
	}
	
	static emWaves2(pos, n) {
		let data = glBuild.dataInit(pos,0x0001 /*gl.LINES*/);

		let f = 0.6
		//glBuild.addLine(data, [0, 0, - 360  * Math.PI / 180.0 * n * f], [0, 0, 360  * Math.PI / 180.0 * n * f], [1, 0, 1])
		glBuild.addFrame();

		let oldE = []
		let oldB = []
		let colE = [1, 0, 0]
		let colB = [0, 0, 1]
		for (let at = - 360 * n; at < 360 * n; at += 10) {
			let t = at * Math.PI / 180.0
			let z = t * 0.6;
			let x = Math.sin(t) * 0.9;
			let y = 0;//Math.cos(t) * 0.9;
			//let ll = data.vertices.length
			
			let base = [0, 0, z]
			let newE = [x, y, z]
			let newB = [y, -x, z]
			
			glBuild.addLine(data, base, newE, colE)
			glBuild.addLine(data, base, newB, colB)
			if (oldE.length > 2) {
				glBuild.addLine(data, oldE, newE, colE)
				glBuild.addLine(data, oldB, newB, colB)
			}
			
			oldE = newE;
			oldB = newB
		}

		return new glInfo(data);
	}
	
	static plain(size, pos, col) {
		let data = glBuild.dataInit(pos,0x0005 /*gl.TRIANGLE_STRIP*/);

		let y = 0;
		let z, zd;
		let d = 0.01;
		let col1 = [1, 0, 0];
		let col2 = [1, 1, 0];
		
		let fl = false;
		for (let y = -0.1; y < 0.1; y += d) {
			fl = !fl;
			for (let xx = -0.1; xx < 0.1; xx += d) {
				let x = fl ? xx : - xx;
				let ll = data.vertices.length / 3;
				z = 10 * (x * x + y * y);
				zd = 10 * (x * x + (y + d) * (y + d));
				data.vertices.push(x, y, z);
				data.vertices.push(x, y + d, zd);
				data.normals.push(0, 0, 1, 0, 0, 1);
				data.colors.push(...col1, ...col2);
				
				data.indices.push(ll, ll + 1);
			}
		}

		return new glInfo(data);
	}
}
class glInfo {
	constructor(data) {
		this.clone = data.clone ? data.clone: null;
		this.pos = data.pos;
		this.tr_matrix = data.trMatrix;
		this.vertices = data.vertices;
		this.normals = data.normals;
		this.colors = data.colors;
		this.indices = data.indices;
		this.glMode = data.glMode;
		this.width = data.width ? data.width : 1;
		this.startVertex = 0;
		this.startIndex = 0;
		this.nIndices = data.indices.length;
		this.cylSymmetry = data.cylSymmetry ? data.cylSymmetry : 1;
		this.sphereSymmetry = data.sphereSymmetry ? data.sphereSymmetry : 1;
		this.func = data.func;
	}
	combine(comb) {
		//console.log('comb.vertices.length = ', comb.vertices.length)
		//console.log('comb.colors.length = ', comb.colors.length)
		//console.log('comb.indices.length = ', comb.indices.length)
		this.startVertex = comb.vertices.length / 3
		this.startIndex = comb.indices.length;
		this.indices = this.indices.map(ind => ind + this.startVertex);
		//console.log('this.vertices.length = ', this.vertices.length)
		//console.log('this.colors.length = ', this.colors.length)
		//console.log('this.indices.length = ', this.indices.length)

		comb.vertices.push(...this.vertices);
		this.vertices = null;

		comb.normals.push(...this.normals);
		this.normals = null;

		comb.colors.push(...this.colors);
		this.colors = null;

		comb.indices.push(...this.indices);
		this.indices = null;
	}
}
class glObj {
	constructor(name, glPack, options = {}) {
		this.name = name;
		this.show = options.show != undefined ? options.show : true;
		this.partial = 1;
		this.children = [];
		this.glPack = glPack;
	}

	showObj = () => {this.show = true};
	hideObj = () => {this.show = false};
	toggleObj = () => {this.show = !this.show};
	combine(comb) {
		this.glPack.combine(comb);
		this.children.forEach(ob => ob.glPack.combine(comb));
	}
	attach(name, glPack) {
		let newObj = new glObj(name, glPack)
		this.children.push(newObj);
		return newObj;
	}
	transformPosition(tr_mat) {
		this.glPack.tr_matrix = multMat4x4(tr_mat, this.glPack.tr_matrix);
	}
	setPosition(pos) {
		pos.forEach((p, ip) => this.glPack.tr_matrix[12 + ip] = p);
	}
	getLocalMatrix() {
		return [...this.glPack.tr_matrix];
	}
	setLocalMatrix(m) {
		this.glPack.tr_matrix = [...m];
	}
	getMemoryMatrix() {
		if (!this.glPack.tr_memoryMatrix) {
			return null;
		}
		return [...this.glPack.tr_memoryMatrix];
	}
	setMemoryMatrix(m) {
		this.glPack.tr_memoryMatrix = [...m];
	}
	showPart(part) {
		this.show = true;
		this.partial = part;
	}
	drawObject(gl, _Mmatrix, mo_matrix) {
		if (!this.show) {
			return null
		}
		const useObject = this.glPack.clone ? this.glPack.clone : this;
		let obj_matrix = multMat4x4(mo_matrix, this.glPack.tr_matrix);
		let nForDraw = Math.floor(this.partial * useObject.glPack.nIndices);
		gl.uniformMatrix4fv(_Mmatrix, false, obj_matrix);
		gl.drawElements(useObject.glPack.glMode, nForDraw, gl.UNSIGNED_INT, 4 * useObject.glPack.startIndex);
		if (useObject.glPack.cylSymmetry && useObject.glPack.cylSymmetry > 1) {
			let angle = Math.PI * 2 / useObject.glPack.cylSymmetry;
			let sa = Math.sin(angle);
			let ca = Math.cos(angle);
			let deltaRotMat = [ca, -sa, 0, 0, sa, ca, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
			let tMat = [...this.glPack.tr_matrix]
			//let obj_matrix = multMat4x4(mo_matrix, this.glPack.tr_matrix)
			for (let d = 1; d < useObject.glPack.cylSymmetry; d++) {
				tMat = multMat4x4(deltaRotMat, tMat)
				let ot_matrix = multMat4x4(mo_matrix, tMat)
				gl.uniformMatrix4fv(_Mmatrix, false, ot_matrix);
				gl.drawElements(useObject.glPack.glMode, nForDraw, gl.UNSIGNED_INT, 4 * useObject.glPack.startIndex);
			}
		}
		if (useObject.glPack.sphereSymmetry && useObject.glPack.sphereSymmetry > 1 ) {
			let theta = Math.PI / useObject.glPack.sphereSymmetry;
			let st = Math.sin(theta);
			let ct = Math.cos(theta);
			let thetaRotMat = [1, 0, 0, 0, 0, ct, -st, 0, 0, st, ct, 0, 0, 0, 0, 1]
			let phi = Math.PI / useObject.glPack.sphereSymmetry;
			let sp = Math.sin(phi);
			let cp = Math.cos(phi);
			let phiRotMat = [cp, -sp, 0, 0, sp, cp, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
			let thMat = [...this.glPack.tr_matrix]
			//let obj_matrix = multMat4x4(mo_matrix, this.glPack.tr_matrix)
			for (let dt = 1; dt < useObject.glPack.sphereSymmetry; dt++) {
				thMat = multMat4x4(thetaRotMat, thMat);
				let phiMat = [...thMat]
				for (let dp = 0; dp < 2 * useObject.glPack.sphereSymmetry; dp++) {
					let ot_matrix = multMat4x4(mo_matrix, phiMat)
					gl.uniformMatrix4fv(_Mmatrix, false, ot_matrix);
					gl.drawElements(useObject.glPack.glMode, nForDraw, gl.UNSIGNED_INT, 4 * useObject.glPack.startIndex);
					phiMat = multMat4x4(phiRotMat, phiMat);
				}
			}
		}
		this.children.forEach(ob => ob.drawObject(gl, _Mmatrix, obj_matrix));

		return obj_matrix;
	}
		
}
