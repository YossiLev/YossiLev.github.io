class Expi {
	constructor(k) {
		this.k = k
	}
	
	getKX(x) {
		let kx = x[0] * this.k[0];
		for (let i = 1; i < 4; i++) {
			kx -= x[i] * this.k[i];
		}
		
		return kx;
	}
	
	getVal(x) {
		let kx = this.getKX(x)
		return {r: Math.cos(- kx), i: Math.sin(- kx) }
	}
	getDerivative(x, di) {
		let kx = this.getKX(x)
		let intDer = {r: - Math.sin(- kx), i: + Math.cos(- kx) }
		
		return Complex.multS(intDer, - this.k[di])		
	}
}

class Complex {
	static bld(r, i) {
		return {r:r, i: i}
	}
	static valid(c) {
		return !(isNaN(c.r) || isNaN(c.i))
	}
	static isBound(c, b) {
		return Complex.valid(c) && Complex.norm(c) < b
	}
	static adjoint(c) {
		return {r: c.r, i: - c.i}
	}
	static add(c1, c2) {
		return {r: c1.r + c2.r, i: c1.i + c2.i}
	}
	static subtract(c1, c2) {
		return {r: c1.r - c2.r, i: c1.i - c2.i}
	}
	static mult(c1, c2) {
		return {r: c1.r * c2.r - c1.i * c2.i,
				i: c1.r * c2.i + c1.i * c2.r}
	}
	static divide(c1, c2) {
		return Complex.multS(Complex.mult(c1, Complex.adjoint(c2)), 1.0 / Complex.norm(c2))
	}
	static multS(c, s) {
		return {r: c.r * s, i: c.i * s}
	}
	static norm(c) {
		return c.r * c.r + c.i * c.i;
	}

	static normalizeVec4(v) {
		let n = 0;
		for (let i = 0; i < 4; i++) {
			n += Complex.norm(v[i])
		}
		n = 1.0 / Math.sqrt(n);
		return v.map(vi => Complex.multS(vi, n))
	}
	
	static putHtml(label, v) {
		document.getElementById(label + '-r').value = v.r;
		document.getElementById(label + '-i').value = v.i;
	}
	static getHtml(label) {
		return Complex.bld(document.getElementById(label + '-r').value, document.getElementById(label + '-i').value);
	}
	
	static getHtmlVec(label) {
		let v = [];
		v.push(Complex.getHtml(label + '-0'));
		v.push(Complex.getHtml(label + '-1'));
		v.push(Complex.getHtml(label + '-2'));
		v.push(Complex.getHtml(label + '-3'));
		
		return v;
	}

	static toReal(cv) {
		return cv.map(c => c.r);
	}
	static toImaginary(cv) {
		return cv.map(c => c.i);
	}

}
