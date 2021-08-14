let singleWorld = null;

class glWorld {
	static allWorlds = [];
	constructor(mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ]) {
		this.objects = [];
		this.mo_matrix = mo_matrix;
		this.setFocus();
		glWorld.allWorlds.push(this);
	}
	setFocus() {
		singleWorld = this;
	}
	static setFocusByCanvas(canvas) {
		let iWorld = glWorld.allWorlds.findIndex(w => w.canvas === canvas);
		if (iWorld >= 0) {
			glWorld.allWorlds[iWorld].setFocus();
		}
	}
	
	addToRoot(name, glPack, options = {}) {
		let newObj = new glObj(name, glPack, options)
		this.objects.push(newObj);

		return newObj;
	}
	
	getComb() {
		let comb = { vertices: [], normals: [], colors: [], indices: []};
		this.objects.forEach(ob => ob.combine(comb))

		return comb;
	}

	getNames() {
		return this.objects.map(ob => ob.name).filter(n => n.substr(0, 1) !== '@');
	}
	getAllNames() {
		return this.objects.map(ob => ob.name)
	}

	getObjectByName(name) {
		return this.objects.find(ob => ob.name == name);
	}
	getSelectedObjects(namesSelections) {
		const names = namesSelections.split(',').map(n => n.trim());
		return this.objects.filter(ob => names.includes(ob.name));
	}
	transformObjects(object, operation, partTime, pos) {
		switch (operation) {
			case "move":
				object.setLocalMatrix(object.getMemoryMatrix());
				object.transformPosition(buildRelativeMat(calcPartialPos(partTime, pos)));
				break;
			case "show":
				object.showPart(partTime);
				break;
		}
	}
	showObjects(namesSelections) {
		this.getSelectedObjects(namesSelections).forEach(o => o.show());
	}
	hideObjects(namesSelections) {
		this.getSelectedObjects(namesSelections).forEach(o => o.hide());
	}
	animate(operation, pos, namesSelections, time) {
		this.canvas.focus();
		this.setFocus();
		let stepTime = 0.0;
		const animObjects = this.getSelectedObjects(namesSelections);
		animObjects.forEach(o => o.setMemoryMatrix(o.getLocalMatrix()));

		const animateTimer = setInterval(() => {
			stepTime += 0.02;
			const partTime = stepTime / time;
			animObjects.forEach(o => this.transformObjects(o, operation, partTime, pos));
			if (time <= stepTime) {
				clearInterval(animateTimer);
			}
		}, 20)
	}

	drawAllObjects() {
		if (this.ctx) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		}
		this.objects.forEach(ob => {
				ob.drawObject(this.gl, this._Mmatrix, this.mo_matrix);
			}
		)
		if (this.ctx) {
			this.ctx.strokeStyle = "black";
			this.ctx.fillStyle = "black";
			this.ctx.fillText("Yossi", 100, 100);
		}
	}
	
	toggleByName(name) {
		let obj = this.objects.filter(ob => ob.name == name).forEach(ob => ob.toggle());
	}

	resetView() {
		const pp = this.get_projection(40, this.canvas.width/this.canvas.height, 1, 40);
		const mm = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ]
		if (!this.proj_matrix) {
			this.proj_matrix = pp;
			this.mo_matrix = mm;
		} else {
			pp.forEach((p, ip) => {this.proj_matrix[ip] = p; });
			mm.forEach((m, im) => {this.mo_matrix[im] = m; });
		}
	}


	get_projection(angle, a, zMin, zMax) {
		const ang = Math.tan((angle*.5)*Math.PI/180);//angle*.5
		//ang /= 4
		let f = 0.1
		return [
			0.5 / ang, 0 , 0, 0,
			0, 0.5 * a / ang, 0, 0,
			0, 0, - f * (zMax + zMin) / (zMax - zMin), -f,
			0, 0, f * (- 2 * zMax * zMin) / (zMax - zMin), 0
		];
	}

	prepare(canvas, tCanvas = null) {
		this.canvas = canvas;
		this.gl = this.canvas.getContext('webgl');
		this.gl.clearColor(0.8, 0.8, 0.8, 0.9);
		this.gl.clearDepth(1.0);
		this.gl.viewport(0.0, 0.0, canvas.width, canvas.height);
		if (tCanvas) {
			this.ctx = tCanvas.getContext("2d");
		}

		const ext = this.gl.getExtension('OES_element_index_uint');

		let comb = this.getComb();

		// Create and store data into vertex buffer
		let vertex_buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex_buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(comb.vertices), this.gl.STATIC_DRAW);

		// Create and store data into normal buffer
		let normal_buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normal_buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(comb.normals), this.gl.STATIC_DRAW);

		// Create and store data into color buffer
		let color_buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(comb.colors), this.gl.STATIC_DRAW);

		// Create and store data into index buffer
		let index_buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index_buffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(comb.indices), this.gl.STATIC_DRAW);

		/*=================== SHADERS =================== */

		let vertCode = [
			'attribute vec3 position;',
			'attribute vec3 normal;',
			'uniform mat4 Pmatrix;',
			'uniform mat4 Vmatrix;',
			'uniform mat4 Mmatrix;',
			'attribute vec3 color;',//the color of the point
			'varying vec4 vColor;',
			'varying vec4 vNormal;',
			'void main(void) { ',//pre-built function
				'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);',
				'vNormal = vec4(normal, 1.0);',
				'vColor = vec4(color, 1.0);',
			'}'
		].join('');

		let fragCode = [
			'precision mediump float;',
			'varying vec4 vColor;',
			'varying vec4 vNormal;',
			'void main(void) {',
				'vec4 vColorA = (vNormal[2] * 0.5 + 0.5) * vColor;',
				'vColorA[3] = 1.0;',
				'gl_FragColor = vColorA;',
			'}'
		].join('');

		let vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
		this.gl.shaderSource(vertShader, vertCode);
		this.gl.compileShader(vertShader);

		let fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		this.gl.shaderSource(fragShader, fragCode);
		this.gl.compileShader(fragShader);

		let shaderprogram = this.gl.createProgram();
		this.gl.attachShader(shaderprogram, vertShader);
		this.gl.attachShader(shaderprogram, fragShader);
		this.gl.linkProgram(shaderprogram);

		/*======== Associating attributes to vertex shader =====*/
		this._Pmatrix = this.gl.getUniformLocation(shaderprogram, "Pmatrix");
		this._Vmatrix = this.gl.getUniformLocation(shaderprogram, "Vmatrix");
		this._Mmatrix = this.gl.getUniformLocation(shaderprogram, "Mmatrix");

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex_buffer);
		let _position = this.gl.getAttribLocation(shaderprogram, "position");
		this.gl.vertexAttribPointer(_position, 3, this.gl.FLOAT, false,0,0);
		this.gl.enableVertexAttribArray(_position);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normal_buffer);
		let _normal = this.gl.getAttribLocation(shaderprogram, "normal");
		this.gl.vertexAttribPointer(_normal, 3, this.gl.FLOAT, false,0,0);
		this.gl.enableVertexAttribArray(_normal);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_buffer);
		let _color = this.gl.getAttribLocation(shaderprogram, "color");
		this.gl.vertexAttribPointer(_color, 3, this.gl.FLOAT, false,0,0) ;
		this.gl.enableVertexAttribArray(_color);
		this.gl.useProgram(shaderprogram);

		/*==================== MATRIX ====================== */


		this.resetView()
		this.view_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0, -6,1 ];


		//this.view_matrix[14] = this.view_matrix[14]-6;

		/*================= Mouse events ======================*/
		this.AMORTIZATION = 0.8;//.95;
		this.drag = false;
		this.dragButton = - 1;
		this.old_x = 0;
		this.old_y = 0;
		this.dX = 0
		this.dY = 0;

		const mouseDown = function(e) {
			if (singleWorld && e.target === singleWorld.canvas) {
				singleWorld.drag = true;
				singleWorld.dragButton = e.buttons;
				singleWorld.old_x = e.pageX, singleWorld.old_y = e.pageY;
				//e.preventDefault();
				return false;
			}
		};

		const mouseUp = function(e){
			if (singleWorld && e.target === singleWorld.canvas) {
				singleWorld.drag = false;
			}
		};

		const mouseMove = function(e) {
			if (singleWorld && e.target === singleWorld.canvas) {
				if (!singleWorld.drag) return false;
				singleWorld.dX = (e.pageX - singleWorld.old_x);//*2*Math.PI/singleWorld.canvas.width,
				singleWorld.dY = (e.pageY - singleWorld.old_y);//*2*Math.PI/singleWorld.canvas.height;

				if (singleWorld.dragButton == 1) { // left button
					let rd = singleWorld.dY * singleWorld.dY + singleWorld.dX * singleWorld.dX
					if (rd > 0.001) {
						rd = 1.0 / Math.sqrt(rd)
						let axis = [-singleWorld.dY * rd, -singleWorld.dX * rd, 0, 1.0]
						let r = mat4FromAxisAngle(axis, 0.005 / rd)
						singleWorld.mo_matrix = multMat4x4(r, singleWorld.mo_matrix)
					}
					//singleWorld.THETA+= singleWorld.dX;
					//singleWorld.PHI+=singleWorld.dY;
				}

				if (singleWorld.dragButton == 2) { // right button
					let shift = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.002 * singleWorld.dX, -0.002 * singleWorld.dY, 0, 1];
					singleWorld.proj_matrix = multMat4x4(shift, singleWorld.proj_matrix)
				}

				singleWorld.old_x = e.pageX;
				singleWorld.old_y = e.pageY;
				e.preventDefault();
			}
		};

		const mouseWheel = function(e) {
			if (singleWorld && e.target === singleWorld.canvas) {

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
					zoomVecs(singleWorld.mo_matrix, Math.pow(b, z))
					for (let i = 0; i < z; i++) {
						singleWorld.ZOOM = singleWorld.ZOOM * b
					}
				}
				e.preventDefault();
			}
		};

		canvas.addEventListener("mousedown", mouseDown, false);
		canvas.addEventListener("mouseup", mouseUp, false);
		canvas.addEventListener("mouseout", mouseUp, false);
		canvas.addEventListener("mousemove", mouseMove, false);
		canvas.addEventListener("onwheel" in document ? "wheel" : "mousewheel", mouseWheel, false)
		canvas.addEventListener('contextmenu', event => event.preventDefault());


		/*=================== Drawing =================== */

		this.THETA = 0;
		this.PHI = 0;
		this.ZOOM = 1.0;
		this.time_old = 0;
		let count = 0;
		let getTime = new Date();
		let lastTime = getTime.getTime();
	}
	
	animateWorld(time) {
		/*
		count += 1;
		if (count % 10 == 0) {
			let nGetTime = new Date();
			let nTime = nGetTime.getTime();
			document.getElementById('log').innerHTML = count.toString() + ' ' + Math.round((1000.0 / (0.1 * (nTime - lastTime)))).toString() + 'fps';
			lastTime = nTime;
		}
		*/
		
		//let dt = time - this.time_old;

		//if (!this.drag) {
		//   this.dX *= this.AMORTIZATION, this.dY *= this.AMORTIZATION;
		//   this.THETA += this.dX, this.PHI += this.dY;
		//}
		//rotateY(this.mo_matrix, this.THETA);
		//rotateX(this.mo_matrix, this.PHI);
		//zoomVecs(this.mo_matrix, this.ZOOM);

		this.time_old = time; 
		this.gl.enable(this.gl.DEPTH_TEST);

		// gl.depthFunc(gl.LEQUAL);
		this.gl.clearColor(1,1,1, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this.gl.uniformMatrix4fv(this._Pmatrix, false, this.proj_matrix);
		this.gl.uniformMatrix4fv(this._Vmatrix, false, this.view_matrix);

		singleWorld.drawAllObjects();

		window.requestAnimationFrame(animateG);
	}
		
	startAnimation() {
		this.animateWorld(1);
	}
}

function animateG() {
	singleWorld.animateWorld(1);
}
