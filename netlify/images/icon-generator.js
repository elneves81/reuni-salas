// Script para gerar ícones PNG temporários usando Canvas
const iconSizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 384, 512];

function generateTemporaryIcon(size) {
    // Criar um canvas temporário
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;
    
    // Background azul gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#3b82f6');
    
    // Desenhar background com bordas arredondadas
    const radius = size * 0.2;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    
    // Adicionar ícone de calendário
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📅', size / 2, size / 2);
    
    return canvas.toDataURL('image/png');
}

// Esta função seria executada no browser para gerar os ícones
console.log('Script de geração de ícones carregado. Use generateTemporaryIcon(size) para gerar ícones.');
