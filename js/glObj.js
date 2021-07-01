class Torus {
	static p(a, exp_eta, theta, psi) {
		let den = a / (0.5 * (exp_eta + 1 / exp_eta) - Math.cos(theta))
		return [0.5 * (exp_eta - 1 / exp_eta) * Math.cos(psi) * den, 
				0.5 * (exp_eta - 1 / exp_eta) * Math.sin(psi) * den,
				Math.sin(theta) * den]
	}
}
class glBuild {
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
			
		let b = new glInfo(data);
		
		return b;
	}
	static torus(size, pos, col) {
		let s = 0.5 * size
		let data = {
			vertices: [],
			colors: [],
			indices: [],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0004 //gl.TRIANGLES, 
		}
		
		let eta = 2.9
		let exp_eta = Math.exp(eta)
		let nead_first_theta = true
		let last_psi = 0;
		let last_theta = 0;
		let prot = 0;
		let last_prot = 0;
		for (let itheta = -180; itheta < 181; itheta +=5) {
			let theta = (Math.PI * itheta) / 180
			if (nead_first_theta) {
				nead_first_theta = false
				last_theta = theta
				continue
			}

			let nead_first_psi = true
			for (let ipsi = -180; ipsi < 181; ipsi +=5) {
				let psi = (Math.PI * ipsi) / 180
				
				if (ipsi < 0) {
					prot = -psi * 0
				} else {
					prot = psi * 0
				}

				if (nead_first_psi) {
					nead_first_psi = false
					last_psi = psi
					last_prot = prot
					continue
				}
			
				let ll = data.vertices.length / 4;
				data.vertices.push(...Torus.p(s, exp_eta, theta + prot, psi))
				data.vertices.push(...Torus.p(s, exp_eta, last_theta + prot, psi))
				data.vertices.push(...Torus.p(s, exp_eta, last_theta + last_prot, last_psi))
				data.vertices.push(...Torus.p(s, exp_eta, theta + last_prot, last_psi))
				data.colors.push(...col, ...col, ...col, ...col)
				data.indices.push(ll, ll + 1, ll + 3, ll + 2, ll + 1, ll + 3)
		
				last_psi = psi
				last_prot = prot
			}
			last_theta = theta
		}
			
		let b = new glInfo(data);
		
		return b;
	}
	
	static addLine(data, p1, p2, c, w = 1) {
		let ll = data.vertices.length / 3
		data.vertices.push(...p1, ...p2);
		data.colors.push(...c, ...c);
		data.indices.push(ll, ll + 1);
		data.width = w;
	}
	
	static diracLines(size, pos, col) {
		let s = 0.5 * size
		let data = {
			vertices: [],
			colors: [],
			indices: [],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0001, //gl.LINES, 
			cylSymmetry: 20,
		}
		
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
						data.colors.push(1, 0, 0,  0, 1, 0);
						let ind = [ll, ll + 1]  
						data.indices.push(...ind);						
					}
				}
			}
		}
			
		let b = new glInfo(data);
		
		return b;
	}

	static electricField(charge, pos, n) {
		let data = {
			vertices: [],
			colors: [],
			indices: [],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0001, //gl.LINES, 
			sphereSymmetry: 10,
		}

		let f = 0.6
		let colE = [1, 0, 0];
		
		for (let z = 0.1; z < 7; z += 0.05) {
			let s = 0.002 * charge / (z * z);
			if (s < 0.001) {
				break;
			}
			glBuild.addLine(data, [0, 0, z], [0, 0, z + s], colE)
		}
			
		let b = new glInfo(data);
		
		return b;
	}
	
	static magneticField(charge, dipol, pos, n) {
		let data = {
			vertices: [],
			colors: [],
			indices: [],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0001, //gl.LINES, 
			cylSymmetry: 50,
		}

		let f = 0.6
		let colB = [0, 0, 1];
		
		for (let x = 0.00; x < 1; x += 0.05) {
			let x2 = x * x;
			for (let z = - 1; z < 1; z += 0.05) {
				let zmd = z - dipol;
				let zpd = z + dipol;
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
			
		let b = new glInfo(data);
		
		return b;
	}
	
	
	static emWaves(kVec, epsilonVec, pos, n) {
		let data = {
			vertices: [],
			colors: [],
			indices: [],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0001, //gl.LINES, 
		}

		let f = 0.6
		//glBuild.addLine(data, [0, 0, - 360  * Math.PI / 180.0 * n * f], [0, 0, 360  * Math.PI / 180.0 * n * f], [1, 0, 1])
		glBuild.addLine(data, [0, 0, 0], [2, 0, 0], [1, 0, 0], 6)
		glBuild.addLine(data, [0, 0, 0], [0, 2, 0], [0, 1, 0], 6)
		glBuild.addLine(data, [0, 0, 0], [0, 0, 2], [0, 0, 1], 6)
	
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
			
		let b = new glInfo(data);
		
		return b;
	}
	
	static emWaves2(pos, n) {
		let data = {
			vertices: [],
			colors: [],
			indices: [],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0001, //gl.LINES, 
		}

		let f = 0.6
		//glBuild.addLine(data, [0, 0, - 360  * Math.PI / 180.0 * n * f], [0, 0, 360  * Math.PI / 180.0 * n * f], [1, 0, 1])
		glBuild.addLine(data, [0, 0, 0], [2, 0, 0], [1, 0, 0], 6)
		glBuild.addLine(data, [0, 0, 0], [0, 2, 0], [0, 1, 0], 6)
		glBuild.addLine(data, [0, 0, 0], [0, 0, 2], [0, 0, 1], 6)
	
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
			
		let b = new glInfo(data);
		
		return b;
	}
	
	static plain(size, pos, col) {
		let data = {
			vertices: [],
			colors: [],
			indices: [],
			trMatrix: buildRelativeMat(pos),
			glMode: 0x0005 //gl.TRIANGLE_STRIP, 
		}

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
				data.colors.push(...col1, ...col2);
				
				data.indices.push(ll, ll + 1);
			}
		}
		
		let b = new glInfo(data);
		
		return b;
	}
}
class glInfo {
	constructor(data) {
		this.tr_matrix = data.trMatrix;
		this.vertices = data.vertices;
		this.colors = data.colors;
		this.indices = data.indices;
		this.glMode = data.glMode;
		this.width = data.width ? data.width : 1;
		this.startVertex = 0;
		this.startIndex = 0;
		this.nIndices = data.indices.length;
		this.cylSymmetry = data.cylSymmetry ? data.cylSymmetry : 1;
		this.sphereSymmetry = data.sphereSymmetry ? data.sphereSymmetry : 1;
	}
	combine(combi) {
		console.log('combi.vertices.length = ', combi.vertices.length)
		console.log('combi.colors.length = ', combi.colors.length)
		console.log('combi.indices.length = ', combi.indices.length)
		this.startVertex = combi.vertices.length / 3
		this.startIndex = combi.indices.length;
		this.indices = this.indices.map(ind => ind + this.startVertex);
		console.log('this.vertices.length = ', this.vertices.length)
		console.log('this.colors.length = ', this.colors.length)
		console.log('this.indices.length = ', this.indices.length)
		let i = 0;
		for (i = 0; i < this.vertices.length; i += 1) {
			combi.vertices.push(this.vertices[i]);
		}
		this.vertices = null;
		for (i = 0; i < this.colors.length; i += 1) {
			combi.colors.push(this.colors[i]);
		}
		this.colors = null;
		for (i = 0; i < this.indices.length; i += 1) {
			combi.indices.push(this.indices[i]);
		}
		this.indices = null;
	}
}
class glObj {
	constructor(name, glPack) {
		this.name = name;
		this.show = true;
		this.children = [];
		this.glPack = glPack;
	}

	show = () => this.show = true
	hide = () => this.show = false
	toggle = () => this.show = !this.show
	combine(combi) {
		console.log(this.name);
		this.glPack.combine(combi);
		this.children.forEach(ob => ob.glPack.combine(combi));
	}
	attach(name, glPack) {
		let newObj = new glObj(name, glPack)
		this.children.push(newObj);
		return newObj;
	}
	draw(gl, _Mmatrix, mo_matrix) {
		if (this.show) {
			let obj_matrix = multMat4x4(mo_matrix, this.glPack.tr_matrix)
			gl.uniformMatrix4fv(_Mmatrix, false, obj_matrix);
			gl.drawElements(this.glPack.glMode, this.glPack.nIndices, gl.UNSIGNED_INT, 4 * this.glPack.startIndex);
			if (this.glPack.cylSymmetry && this.glPack.cylSymmetry > 1) {
				let angle = Math.PI * 2 / this.glPack.cylSymmetry;
				let sa = Math.sin(angle);
				let ca = Math.cos(angle);
				let deltaRotMat = [ca, -sa, 0, 0, sa, ca, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
				let tMat = [...this.glPack.tr_matrix]
				let obj_matrix = multMat4x4(mo_matrix, this.glPack.tr_matrix)
				for (let d = 1; d < this.glPack.cylSymmetry; d++) {
					tMat = multMat4x4(deltaRotMat, tMat)
					let ot_matrix = multMat4x4(mo_matrix, tMat)
					gl.uniformMatrix4fv(_Mmatrix, false, ot_matrix);
					gl.drawElements(this.glPack.glMode, this.glPack.nIndices, gl.UNSIGNED_INT, 4 * this.glPack.startIndex);
				}
			}
			if (this.glPack.sphereSymmetry && this.glPack.sphereSymmetry > 1 ) {
				let theta = Math.PI / this.glPack.sphereSymmetry;
				let st = Math.sin(theta);
				let ct = Math.cos(theta);
				let thetaRotMat = [1, 0, 0, 0, 0, ct, -st, 0, 0, st, ct, 0, 0, 0, 0, 1]
				let phi = Math.PI / this.glPack.sphereSymmetry;
				let sp = Math.sin(phi);
				let cp = Math.cos(phi);
				let phiRotMat = [cp, -sp, 0, 0, sp, cp, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
				let thMat = [...this.glPack.tr_matrix]
				let obj_matrix = multMat4x4(mo_matrix, this.glPack.tr_matrix)
				for (let dt = 1; dt < this.glPack.sphereSymmetry; dt++) {
					thMat = multMat4x4(thetaRotMat, thMat);
					let phiMat = [...thMat]
					for (let dp = 0; dp < 2 * this.glPack.sphereSymmetry; dp++) {
						let ot_matrix = multMat4x4(mo_matrix, phiMat)
						gl.uniformMatrix4fv(_Mmatrix, false, ot_matrix);
						gl.drawElements(this.glPack.glMode, this.glPack.nIndices, gl.UNSIGNED_INT, 4 * this.glPack.startIndex);
						phiMat = multMat4x4(phiRotMat, phiMat);
					}
				}
			}
			this.children.forEach(ob => ob.draw(gl, _Mmatrix, obj_matrix));
		}
	}
		
}
