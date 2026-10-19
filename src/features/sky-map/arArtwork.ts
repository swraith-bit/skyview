// Holographic mythology vector artwork drawer
export const drawConstellationArtwork = (
 ctx: CanvasRenderingContext2D,
 id: string,
 projectedStars: Record<string, { x: number; y: number }>,
 isNightMode: boolean
) => {
 ctx.save();
 ctx.lineWidth = 1.5;
 ctx.setLineDash([6, 5]);
 ctx.lineDashOffset = -Date.now() / 45; // Animated flowing dashed neon effect
 
 if (isNightMode) {
 ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
 ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
 ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
 ctx.shadowBlur = 10;
 } else {
 ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)'; // neon indigo glow
 ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
 ctx.shadowColor = 'rgba(99, 102, 241, 0.9)';
 ctx.shadowBlur = 14;
 }

 const getPt = (starId: string) => projectedStars[starId];

 if (id === 'leo') {
 const regulus = getPt('regulus');
 const algieba = getPt('algieba');
 const rasalas = getPt('rasalas');
 const zosma = getPt('zosma');
 const denebola = getPt('denebola');
 const chertan = getPt('chertan');

 if (regulus && algieba && rasalas && zosma && denebola && chertan) {
 ctx.beginPath();
 ctx.moveTo(regulus.x, regulus.y);
 ctx.bezierCurveTo(algieba.x + 20, algieba.y - 30, rasalas.x + 10, rasalas.y - 40, rasalas.x, rasalas.y);
 ctx.lineTo(algieba.x, algieba.y);
 ctx.lineTo(zosma.x, zosma.y);
 ctx.bezierCurveTo(zosma.x + 10, zosma.y - 15, denebola.x, denebola.y - 25, denebola.x, denebola.y);
 ctx.lineTo(chertan.x, chertan.y);
 ctx.closePath();
 ctx.stroke();
 ctx.fill();
 
 ctx.beginPath();
 ctx.moveTo(denebola.x, denebola.y);
 ctx.quadraticCurveTo(denebola.x + 30, denebola.y + 20, denebola.x + 40, denebola.y - 10);
 ctx.stroke();
 }
 } 
 else if (id === 'cygnus') {
 const deneb = getPt('deneb');
 const sadr = getPt('sadr');
 const albireo = getPt('albireo');
 const gienah = getPt('gienah');
 const fawaris = getPt('fawaris');

 if (deneb && sadr && albireo && gienah && fawaris) {
 ctx.beginPath();
 ctx.moveTo(deneb.x, deneb.y);
 ctx.lineTo(albireo.x, albireo.y);
 ctx.stroke();

 ctx.beginPath();
 ctx.moveTo(sadr.x, sadr.y);
 ctx.quadraticCurveTo(fawaris.x - 30, fawaris.y + 10, fawaris.x, fawaris.y);
 ctx.bezierCurveTo(fawaris.x + 20, fawaris.y - 30, sadr.x + 20, sadr.y - 40, deneb.x, deneb.y);
 ctx.bezierCurveTo(sadr.x - 20, sadr.y - 40, gienah.x - 20, gienah.y - 30, gienah.x, gienah.y);
 ctx.quadraticCurveTo(gienah.x + 30, gienah.y + 10, sadr.x, sadr.y);
 ctx.closePath();
 ctx.stroke();
 ctx.fill();
 }
 }
 else if (id === 'taurus') {
 const aldebaran = getPt('aldebaran');
 const elnath = getPt('elnath');

 if (aldebaran && elnath) {
 ctx.beginPath();
 ctx.moveTo(aldebaran.x, aldebaran.y);
 ctx.quadraticCurveTo(aldebaran.x + 25, aldebaran.y - 45, elnath.x, elnath.y);
 ctx.moveTo(aldebaran.x, aldebaran.y);
 ctx.quadraticCurveTo(aldebaran.x - 45, aldebaran.y - 25, aldebaran.x - 60, aldebaran.y - 60);
 ctx.stroke();

 ctx.beginPath();
 ctx.moveTo(aldebaran.x, aldebaran.y);
 ctx.lineTo(aldebaran.x - 15, aldebaran.y + 25);
 ctx.lineTo(aldebaran.x + 15, aldebaran.y + 20);
 ctx.closePath();
 ctx.stroke();
 ctx.fill();
 }
 }
 else if (id === 'cassiopeia') {
 const schedar = getPt('schedar');
 const gammacas = getPt('gammacas');
 const ruchbah = getPt('ruchbah');
 const segin = getPt('segin');

 if (schedar && gammacas && ruchbah && segin) {
 ctx.beginPath();
 ctx.moveTo(schedar.x, schedar.y);
 ctx.lineTo(gammacas.x, gammacas.y);
 ctx.lineTo(ruchbah.x, ruchbah.y);
 ctx.lineTo(segin.x, segin.y);
 ctx.lineTo(segin.x - 10, segin.y - 20);
 ctx.lineTo(ruchbah.x, ruchbah.y - 15);
 ctx.lineTo(gammacas.x, gammacas.y - 25);
 ctx.lineTo(schedar.x, schedar.y - 15);
 ctx.closePath();
 ctx.stroke();
 ctx.fill();
 }
 }
 else if (id === 'gemini') {
 const castor = getPt('castor');
 const pollux = getPt('pollux');

 if (castor && pollux) {
 ctx.beginPath();
 ctx.arc(castor.x, castor.y - 10, 6, 0, Math.PI * 2);
 ctx.moveTo(castor.x, castor.y);
 ctx.lineTo(castor.x, castor.y + 30);
 ctx.lineTo(castor.x - 10, castor.y + 50);
 ctx.moveTo(castor.x, castor.y + 30);
 ctx.lineTo(castor.x + 10, castor.y + 50);
 ctx.moveTo(castor.x, castor.y + 12);
 ctx.lineTo(castor.x - 15, castor.y + 20);
 ctx.moveTo(castor.x, castor.y + 12);
 ctx.lineTo((castor.x + pollux.x)/2, (castor.y + pollux.y)/2 + 10);
 ctx.stroke();

 ctx.beginPath();
 ctx.arc(pollux.x, pollux.y - 10, 6, 0, Math.PI * 2);
 ctx.moveTo(pollux.x, pollux.y);
 ctx.lineTo(pollux.x, pollux.y + 30);
 ctx.lineTo(pollux.x - 10, pollux.y + 50);
 ctx.moveTo(pollux.x, pollux.y + 30);
 ctx.lineTo(pollux.x + 10, pollux.y + 50);
 ctx.moveTo(pollux.x, pollux.y + 12);
 ctx.lineTo(pollux.x + 15, pollux.y + 20);
 ctx.moveTo(pollux.x, pollux.y + 12);
 ctx.lineTo((castor.x + pollux.x)/2, (castor.y + pollux.y)/2 + 10);
 ctx.stroke();
 }
 }
 else if (id === 'pegasus') {
 const markab = getPt('markab');
 const scheat = getPt('scheat');

 if (markab && scheat) {
 ctx.beginPath();
 ctx.moveTo(scheat.x, scheat.y);
 ctx.quadraticCurveTo(scheat.x - 40, scheat.y - 40, scheat.x - 60, scheat.y - 10);
 ctx.quadraticCurveTo(scheat.x - 30, scheat.y - 10, markab.x, markab.y);
 ctx.stroke();

 ctx.beginPath();
 ctx.moveTo(markab.x, markab.y);
 ctx.lineTo(markab.x + 20, markab.y + 30);
 ctx.lineTo(markab.x + 35, markab.y + 25);
 ctx.stroke();
 }
 }
 else if (id === 'andromeda') {
 const alpheratz = getPt('alpheratz');
 const mirach = getPt('mirach');
 const almach = getPt('almach');

 if (alpheratz && mirach && almach) {
 ctx.beginPath();
 ctx.moveTo(alpheratz.x, alpheratz.y);
 ctx.bezierCurveTo(mirach.x - 15, mirach.y - 5, almach.x - 10, almach.y + 10, almach.x, almach.y);
 ctx.bezierCurveTo(almach.x + 25, almach.y + 15, mirach.x + 20, mirach.y - 5, alpheratz.x, alpheratz.y);
 ctx.closePath();
 ctx.stroke();
 ctx.fill();
 }
 }
 else if (id === 'aries') {
 const hamal = getPt('hamal');

 if (hamal) {
 ctx.beginPath();
 ctx.moveTo(hamal.x, hamal.y);
 ctx.bezierCurveTo(hamal.x + 20, hamal.y - 25, hamal.x + 35, hamal.y + 5, hamal.x + 15, hamal.y + 10);
 ctx.moveTo(hamal.x, hamal.y);
 ctx.bezierCurveTo(hamal.x - 20, hamal.y - 25, hamal.x - 35, hamal.y + 5, hamal.x - 15, hamal.y + 10);
 ctx.stroke();
 }
 }

 ctx.restore();
};

export const drawMoonPhase = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fraction: number,
  isWaxing: boolean,
  isRedMode: boolean,
) => {
  const shadowColor = isRedMode ? 'rgba(30, 0, 0, 0.95)' : 'rgba(5, 7, 16, 0.95)';
  const litColor = isRedMode ? 'rgba(239, 68, 68, 1)' : 'rgba(254, 253, 244, 1)';
  const glowColor = isRedMode ? 'rgba(220, 38, 38, 0.45)' : 'rgba(253, 254, 203, 0.35)';

  ctx.shadowBlur = 12;
  ctx.shadowColor = glowColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = litColor;
  ctx.fill();
  ctx.shadowBlur = 0;

  if (fraction >= 0.97) return;

  ctx.fillStyle = shadowColor;
  if (fraction <= 0.03) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 0.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 0.4, 0, Math.PI * 2);
  ctx.clip();

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 0.4, Math.PI / 2, Math.PI * 1.5, !isWaxing);
  ctx.fill();

  const ellipseWidth = Math.abs(radius * (2 * fraction - 1));
  ctx.beginPath();
  ctx.ellipse(cx, cy, ellipseWidth, radius + 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = (fraction < 0.5 && isWaxing) || (fraction > 0.5 && !isWaxing)
    ? shadowColor
    : litColor;
  ctx.fill();
  ctx.restore();
};
