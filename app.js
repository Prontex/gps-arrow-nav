let target = null;
let heading = 0;
let northOffset = 0;
let currentPos = null;

const canvas = document.getElementById('arrowCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function drawArrow(angle, color) {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle - (heading - northOffset) - 90) * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, -60);  // tip of arrow
  ctx.lineTo(20, 20);
  ctx.lineTo(0, 10);
  ctx.lineTo(-20, 20);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawNorth() {
  ctx.save();
  ctx.translate(canvas.width - 30, 30);
  ctx.rotate((-(heading - northOffset)) * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(6, 6);
  ctx.lineTo(0, 2);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.font = '10px sans-serif';
  ctx.fillText("N", -3, 18);
  ctx.restore();
}

function computeDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function computeBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180)*Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180)*Math.cos(lat2 * Math.PI / 180)*Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function setTarget() {
  const lat = parseFloat(document.getElementById('lat').value);
  const lon = parseFloat(document.getElementById('lon').value);
  if (!isNaN(lat) && !isNaN(lon)) {
    target = { lat, lon };
    requestOrientationPermission();
  }
}

function calibrateNorth() {
  northOffset = heading;
}

function toggleHint() {
  const hint = document.getElementById('hint');
  hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
}

function resetApp() {
  target = null;
  document.getElementById('lat').value = '';
  document.getElementById('lon').value = '';
  document.getElementById('hint').style.display = 'none';
  drawArrow(0, 'white');
}

navigator.geolocation.watchPosition(pos => {
  currentPos = { lat: pos.coords.latitude, lon: pos.coords.longitude };
  const loc = document.getElementById('currentLocation');
  loc.textContent = `Current: ${currentPos.lat.toFixed(6)}, ${currentPos.lon.toFixed(6)}`;
}, console.error, { enableHighAccuracy: true });

function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          alert("Compass access denied. Cannot orient.");
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

function handleOrientation(event) {
  if (event.webkitCompassHeading !== undefined) {
    heading = event.webkitCompassHeading;
  } else if (event.alpha !== null) {
    heading = 360 - event.alpha;
  }
}

function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (target && currentPos) {
    const bearing = computeBearing(currentPos.lat, currentPos.lon, target.lat, target.lon);
    const distance = computeDistance(currentPos.lat, currentPos.lon, target.lat, target.lon);
    const relBearing = (bearing - heading + 360) % 360;
    const hue = Math.max(0, Math.min(120, 120 * Math.max(0, 1 - distance / 1000)));
    drawArrow(relBearing, `hsl(${hue}, 100%, 50%)`);
    document.getElementById('distance').textContent = distance.toFixed(1);
  }
  drawNorth();
}

animate();
