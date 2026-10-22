import * as THREE from "three";

export interface CardTextureOptions {
  photoUrl: string;
  name: string;
  role: string;
  initials?: string;
  badgeId?: string;
  subText?: string;
  accentColor?: string;
}

/**
 * Draws the front and back of the Lanyard Card on a 1024x1024 canvas context.
 * The card 3D model uses U in [0, 0.5] for the front, and U in [0.5, 1.0] for the back.
 */
export function drawLanyardCard(
  ctx: CanvasRenderingContext2D,
  options: CardTextureOptions,
  img?: HTMLImageElement
) {
  const accent = options.accentColor || "#ff7a00";
  const initials = (options.initials || "DN").toUpperCase();
  const badgeId = (options.badgeId || "DEV ID • VERIFIED").toUpperCase();
  const subText = options.subText || "ID: 2026-DHATIN-DEV-SECURE";
  const role = (options.role || "FULL-STACK DEV").toUpperCase();
  const name = (options.name || "Dhatin Nuril Arsandy").toUpperCase();

  ctx.clearRect(0, 0, 1024, 1024);

  // ==========================================
  // 1. FRONT OF THE CARD (X: 0 to 512, Y: 0 to 768)
  // ==========================================
  // Base dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 768);
  bgGrad.addColorStop(0, "#0c0a14");
  bgGrad.addColorStop(0.5, "#141122");
  bgGrad.addColorStop(1, "#08070d");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 768);

  // Subtle tech grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let x = 32; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 768);
    ctx.stroke();
  }
  for (let y = 32; y < 768; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Card Outer Glow Border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, 480, 736);

  // Top Header: Logo / Initials Badge
  ctx.save();
  const badgeGrad = ctx.createLinearGradient(35, 35, 135, 75);
  badgeGrad.addColorStop(0, accent);
  badgeGrad.addColorStop(1, "#f59e0b");
  ctx.fillStyle = badgeGrad;
  ctx.beginPath();
  ctx.roundRect(35, 35, 95, 40, 8);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, 82, 55);

  // Header Role Tag on top right
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.roundRect(260, 35, 215, 40, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(280, 55, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px 'Inter', sans-serif";
  ctx.textAlign = "left";
  const shortRole = role.slice(0, 18);
  ctx.fillText(shortRole, 294, 56);
  ctx.restore();

  // Portrait / Photo Area (Centered from X: 45 to 467, Y: 96 to 596)
  const photoX = 45;
  const photoY = 96;
  const photoW = 422;
  const photoH = 500;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 16);
  ctx.clip();

  // Dark photo background
  const photoBg = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH);
  photoBg.addColorStop(0, "#19152b");
  photoBg.addColorStop(1, "#0d0b17");
  ctx.fillStyle = photoBg;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  // Draw user photo if loaded
  if (img && img.naturalWidth) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = photoW / photoH;
    let sW, sH, sX, sY;

    if (imgRatio > boxRatio) {
      sH = img.naturalHeight;
      sW = img.naturalHeight * boxRatio;
      sX = (img.naturalWidth - sW) / 2;
      sY = 0;
    } else {
      sW = img.naturalWidth;
      sH = img.naturalWidth / boxRatio;
      sX = 0;
      sY = (img.naturalHeight - sH) / 2;
    }

    ctx.drawImage(img, sX, sY, sW, sH, photoX, photoY, photoW, photoH);
  } else {
    // Elegant avatar placeholder if image is loading
    const avatarGrad = ctx.createLinearGradient(
      photoX + photoW / 2 - 80,
      photoY + photoH / 2 - 120,
      photoX + photoW / 2 + 80,
      photoY + photoH / 2 + 40
    );
    avatarGrad.addColorStop(0, accent);
    avatarGrad.addColorStop(1, "#ea580c");
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(photoX + photoW / 2, photoY + photoH / 2 - 40, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, photoX + photoW / 2, photoY + photoH / 2 - 40);
  }

  // Subtle bottom gradient shadow over the photo for contrast
  const shadowGrad = ctx.createLinearGradient(photoX, photoY + photoH - 130, photoX, photoY + photoH);
  shadowGrad.addColorStop(0, "rgba(8, 7, 13, 0)");
  shadowGrad.addColorStop(1, "rgba(8, 7, 13, 0.95)");
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(photoX, photoY + photoH - 130, photoW, 130);
  ctx.restore();

  // Photo border
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 16);
  ctx.stroke();
  ctx.restore();

  // Bottom Details on card front (Y: 620 to 740)
  ctx.save();
  ctx.fillStyle = accent;
  ctx.font = "bold 11px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.letterSpacing = "2px";
  ctx.fillText(badgeId, photoX + 5, 628);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 23px 'Inter', sans-serif";
  ctx.fillText(name, photoX + 5, 663);

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "14px 'Inter', sans-serif";
  ctx.fillText(options.role || "Full-Stack Developer", photoX + 5, 693);
  ctx.restore();

  // ==========================================
  // 2. BACK OF THE CARD (X: 512 to 1024, Y: 0 to 768)
  // ==========================================
  const backBg = ctx.createLinearGradient(512, 0, 1024, 768);
  backBg.addColorStop(0, "#0a0910");
  backBg.addColorStop(1, "#161224");
  ctx.fillStyle = backBg;
  ctx.fillRect(512, 0, 512, 768);

  // Decorative border on card back
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(546, 36, 444, 696);

  // Inner accent line
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.strokeRect(556, 46, 424, 676);
  ctx.globalAlpha = 1;

  // Large Monogram in center of card back
  ctx.save();
  const logoGrad = ctx.createLinearGradient(690, 220, 846, 376);
  logoGrad.addColorStop(0, accent);
  logoGrad.addColorStop(1, "#ea580c");
  ctx.fillStyle = logoGrad;
  ctx.beginPath();
  ctx.roundRect(690, 220, 156, 156, 24);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, 768, 298);

  // Card Back Labels
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText("PORTFOLIO PASS", 768, 425);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "13px 'Inter', sans-serif";
  ctx.fillText("FULL-STACK • DESIGN • VIDEO", 768, 455);

  // Security chip decoration
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.roundRect(728, 490, 80, 50, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.stroke();

  // Stylized barcode at bottom of back
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  const barX = 612;
  const barY = 585;
  const barW = 312;
  const barH = 50;
  const barCount = 42;
  for (let b = 0; b < barCount; b++) {
    const bx = barX + (b * (barW / barCount));
    const bw = (b % 4 === 0 ? 4 : (b % 2 === 0 ? 2 : 5));
    ctx.fillRect(bx, barY, bw, barH);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "11px monospace";
  ctx.fillText(subText, 768, 665);
  ctx.restore();
}

export function createCardTexture(
  options: CardTextureOptions,
  onUpdate?: (texture: THREE.CanvasTexture) => void
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.anisotropy = 16;
  if ("colorSpace" in texture) {
    (texture as any).colorSpace = THREE.SRGBColorSpace;
  }

  function render(img?: HTMLImageElement) {
    drawLanyardCard(ctx, options, img);
    texture.needsUpdate = true;
    if (onUpdate) onUpdate(texture);
  }

  // Initial draw
  render();

  // Load photo
  if (options.photoUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      render(img);
    };
    img.onerror = () => {
      if (options.photoUrl !== "/images/mypicnbg.png") {
        const fallback = new Image();
        fallback.crossOrigin = "anonymous";
        fallback.onload = () => render(fallback);
        fallback.src = "/images/mypicnbg.png";
      }
    };
    img.src = options.photoUrl;
  }

  return texture;
}
