/*=========================rotation================*/
function shiftMat3(m, s) {
	let ms = [...m]
	ms[3] += s[0]
	ms[7] += s[1]
	ms[11] += s[2]
	
	return ms;
}

function calcPartialPos(part, pos) {
	return pos.map(p => p * part);
}
function buildRelativeMat(pos) {
	const ph = pos[3] * Math.PI / 180
	const th = pos[4] * Math.PI / 180
	const ps = pos[5] * Math.PI / 180

	const sph = Math.sin(ph)
	const cph = Math.cos(ph)
	const sth = Math.sin(th)
	const cth = Math.cos(th)
	const sps = Math.sin(ps)
	const cps = Math.cos(ps)

	return [ cth * cps,                     cth * sps,                   - sth      , 0,
			- cph * sps + sph * sth * cps,   cph * cps + sph * sth * sps,   sph * cth, 0, 
			  sph * sps + cph * sth * cps, - sph * cps + cph * sth * sps,   cph * cth, 0, 
			pos[0], pos[1], pos[2], 1]
}

function multMat4x4(m2, m1) {
	let m = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

	m[0] = m1[0] * m2[0] + m1[1] * m2[4] + m1[2] * m2[8] + m1[3] * m2[12]
	m[1] = m1[0] * m2[1] + m1[1] * m2[5] + m1[2] * m2[9] + m1[3] * m2[13]
	m[2] = m1[0] * m2[2] + m1[1] * m2[6] + m1[2] * m2[10] + m1[3] * m2[14]
	m[3] = m1[0] * m2[3] + m1[1] * m2[7] + m1[2] * m2[11] + m1[3] * m2[15]
	m[4] = m1[4] * m2[0] + m1[5] * m2[4] + m1[6] * m2[8] + m1[7] * m2[12]
	m[5] = m1[4] * m2[1] + m1[5] * m2[5] + m1[6] * m2[9] + m1[7] * m2[13]
	m[6] = m1[4] * m2[2] + m1[5] * m2[6] + m1[6] * m2[10] + m1[7] * m2[14]
	m[7] = m1[4] * m2[3] + m1[5] * m2[7] + m1[6] * m2[11] + m1[7] * m2[15]
	m[8] = m1[8] * m2[0] + m1[9] * m2[4] + m1[10] * m2[8] + m1[11] * m2[12]
	m[9] = m1[8] * m2[1] + m1[9] * m2[5] + m1[10] * m2[9] + m1[11] * m2[13]
	m[10] = m1[8] * m2[2] + m1[9] * m2[6] + m1[10] * m2[10] + m1[11] * m2[14]
	m[11] = m1[8] * m2[3] + m1[9] * m2[7] + m1[10] * m2[11] + m1[11] * m2[15]
	m[12] = m1[12] * m2[0] + m1[13] * m2[4] + m1[14] * m2[8] + m1[15] * m2[12]
	m[13] = m1[12] * m2[1] + m1[13] * m2[5] + m1[14] * m2[9] + m1[15] * m2[13]
	m[14] = m1[12] * m2[2] + m1[13] * m2[6] + m1[14] * m2[10] + m1[15] * m2[14]
	m[15] = m1[12] * m2[3] + m1[13] * m2[7] + m1[14] * m2[11] + m1[15] * m2[15]
	
	return m
}

function mat4FromAxisAngle(a, angle) {
	const c = Math.cos(angle)
	const s = Math.sin(angle)
	const t = 1.0 - c

	let m =  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	m[        0] = t * a[0] * a[0] + c
	m[        1] = t * a[0] * a[1] - a[2] * s
	m[        2] = t * a[0] * a[2] + a[1] * s
	m[    4    ] = t * a[0] * a[1] + a[2] * s
	m[    4 + 1] = t * a[1] * a[1] + c
	m[    4 + 2] = t * a[1] * a[2] - a[0] * s
	m[2 * 4    ] = t * a[0] * a[2] - a[1] * s
	m[2 * 4 + 1] = t * a[1] * a[2] + a[0] * s
	m[2 * 4 + 2] = t * a[2] * a[2] + c
	m[3 * 4 + 3] = 1.0
	
	return m
}

function multMat3x3(m1, m2) {
	let m = [0, 0, 0, 0, 0, 0, 0, 0, 0];

	m[0] = m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6]
	m[1] = m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7]
	m[2] = m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8]
	m[3] = m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6]
	m[4] = m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7]
	m[5] = m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8]
	m[6] = m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6]
	m[7] = m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7]
	m[8] = m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8]
	
	return m
}
function multMatVec3(m, v) {
	let vr = [0, 0, 0];

	vr[0] = m[0] * v[0] + m[1] * v[1] + m[2] * v[2]
	vr[1] = m[3] * v[0] + m[4] * v[1] + m[5] * v[2]
	vr[2] = m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
	
	return vr
}

function multVec3(v1, v2) {
	let v = [0, 0 ,0]
	v[0] = v1[1] * v2[2] - v1[2] * v2[1]
	v[1] = v1[2] * v2[0] - v1[0] * v2[2]
	v[2] = v1[0] * v2[1] - v1[1] * v2[0]
	return v
}
function multScalarVec3(v1, v2) {
	return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
}

function normVec3(v) {
	return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}
function norm2Vec3(v) {
	return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}
function normalizeVec3(v) {
	let n = normVec3(v)
	return [v[0] / n, v[1] / n, v[2] / n]
}
function midVec3(v1, v2, p) {
	const cp = 1.0 - p;
	return [v1[0] * cp + v2[0] * p, v1[1] * cp + v2[1] * p, v1[2] * cp + v2[2] * p]
}
function addVec3(v1, v2) {
	return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]]
}
function subVec3(v1, v2) {
	return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]]
}
function distVec3(v1, v2) {
	return normVec3(subVec3(v1, v2));
}
function rotateX(m, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	const mv1 = m[1], mv5 = m[5], mv9 = m[9];

	m[1] = m[1]*c-m[2]*s;
	m[5] = m[5]*c-m[6]*s;
	m[9] = m[9]*c-m[10]*s;

	m[2] = m[2]*c+mv1*s;
	m[6] = m[6]*c+mv5*s;
	m[10] = m[10]*c+mv9*s;
}

function rotateY(m, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	const mv0 = m[0], mv4 = m[4], mv8 = m[8];

	m[0] = c*m[0]+s*m[2];
	m[4] = c*m[4]+s*m[6];
	m[8] = c*m[8]+s*m[10];

	m[2] = c*m[2]-s*mv0;
	m[6] = c*m[6]-s*mv4;
	m[10] = c*m[10]-s*mv8;
}
 
function zoomVecs(m, z) {

	for (let i = 0; i < 12; i++) {
		m[i] = m[i] * z;
	}
}
