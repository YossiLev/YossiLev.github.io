
class emPotential {
	constructor(eps, k) {
		this.eps = Complex.normalizeVec4(eps);
		this.expi = new Expi(k);
	}
	
	calcVal(x) {
		let expV = this.expi.getVal(x)
		return this.eps.map(ep => Complex.mult(expV, ep)) 
	}
	
	calcDerivative(x, di, aj) {
		return Complex.mult(this.expi.getDerivative(x, di), this.eps[aj])
	}
	
	calcE(x) {
		let e = []
		for (let i = 0; i < 3; i++) {
			e.push(this.calcDerivative(x, 0, i + 1))
		}
		
		return e
	}
	calcB(x) {
		let b = []
		for (let k = 0; k < 3; k++) {
			let pi = (k + 1) % 3
			let pj = (k + 2) % 3
			
			b.push(Complex.subtract(this.calcDerivative(x, pi + 1, pj + 1), this.calcDerivative(x, pj + 1, pi + 1)))
		}
		
		return b
	}
}