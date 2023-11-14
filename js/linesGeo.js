
function distanceBetweenTwo3dLines(line1, line2) {
    // line is given as [x, y, z, dx, dy, dz]
    let m0 = line1[4] * line2[5] - line1[5] * line2[4];
    let m1 = line1[5] * line2[3] - line1[3] * line2[5];
    let m2 = line1[3] * line2[4] - line1[4] * line2[3];
    let p0 = line1[0] - line2[0];
    let p1 = line1[1] - line2[1];
    let p2 = line1[2] - line2[2];
    return Math.abs((m0 * p0 + m1 * p1 + m2 * p2) / Math.sqrt(m0 * m0, + m1 * m1 + m2 * m2));
}
