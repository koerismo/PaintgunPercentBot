// Canvas.js

const { createCanvas } = require('canvas')

function intToTimeStr(x) {
	function f(e) {return e.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:true})}
	return `${f(Math.floor((x/60/60)%60))}:${f(Math.floor((x/60)%60))}:${f(Math.floor(x%60))}`
}

exports.drawStatImage = function(chapter,res,highlighted=[]) {
	const mainCanv = createCanvas(500*res,800*res)

	function draw(el,ch) {
		const scale = res;
		
		// Adapted from https://stackoverflow.com/a/3368118
		function roundedRect(x,y,w,h,r) {
			ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.quadraticCurveTo(x + w, y, x + w, y + r);
			ctx.lineTo(x + w, y + h - r);
			ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
			ctx.lineTo(x + r, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - r);
			ctx.lineTo(x, y + r);
			ctx.quadraticCurveTo(x, y, x + r, y);
			ctx.closePath();
			ctx.stroke();
		}

		function remap(x,a,b,c,d) {return (Math.min(Math.max(x,a),b)-a)/(b-a)*(d-c)+c}
		
		var ctx = el.getContext('2d');
		
		// Background
		ctx.fillStyle = '#04081a';
		ctx.fillRect(0,0,el.width,el.height);
		
		// Chapter text
		const header_height = remap(ch.levels.length,19,25,350,240);
		const header_text_scale = Math.round(header_height*(250/350));

		ctx.font = `500 ${20*scale}px Open Sans`;
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		ctx.fillText('CHAPTER', el.width/2-header_text_scale/2*scale, (header_height/2-20-header_text_scale/3.5)*scale);
		
		ctx.font = `300 ${header_text_scale*scale}px Open Sans`;
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(ch.chapter_short, el.width/2, (header_height/2-header_text_scale/1.5)*scale);
		
		// List header
		const list_pos = header_height*scale;
		const list_item_height = remap(ch.levels.length,14,20,30,18)*scale;
		const list_text_size = remap(ch.levels.length,18,20,15,10)*scale;
		
		ctx.fillStyle = '#fff2';
		ctx.strokeStyle = '#fff';
		ctx.fillRect(20*scale,list_pos-20*scale,el.width-40*scale,20*scale);
		ctx.strokeRect(20*scale,list_pos-20*scale,el.width-40*scale,20*scale);
	 
		// List header text
		ctx.font = `${10*scale}px sans-serif`;
		ctx.fillStyle = '#fff';
		
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText('LEVEL NAME', 25*scale, list_pos-9*scale);
		
		ctx.textAlign = 'right';
		ctx.fillText('TOP RUNNER', el.width-190*scale, list_pos-9*scale);
		ctx.fillText('BEST PORTALS', el.width-95*scale, list_pos-9*scale);
		ctx.fillText('BEST TIME', el.width-25*scale, list_pos-9*scale);

		// List items
		ctx.font = `${list_text_size}px sans-serif`;
		
		for (let level_ind = 0; level_ind < ch.levels.length; level_ind++) {
			let level = ch.levels[level_ind];

			ctx.fillStyle = `#ffffff${(level_ind%2) ? '22' : '11'}`;
			if (highlighted.includes(level.name)) {ctx.fillStyle = '#fff4'}
			ctx.strokeStyle = '#888';

			ctx.fillRect(20*scale,
						 list_pos + list_item_height * level_ind,
						 el.width-40*scale,
						 list_item_height);
			ctx.strokeRect(20*scale,
						   list_pos + list_item_height * level_ind,
						   el.width-40*scale,
						   list_item_height);
			
			ctx.fillStyle = `#fff8`;
			if (highlighted.includes(level.name)) {ctx.fillStyle = '#fff'}
			ctx.textAlign = 'left';
			ctx.fillText(level.name,
						 30*scale,
						 list_pos + list_item_height * level_ind + list_item_height / 2)
			
			ctx.fillStyle = `#fffb`;
			if (highlighted.includes(level.name)) {ctx.fillStyle = '#fff'}
			ctx.textAlign = 'right';

			ctx.fillText(level.top_runner,
						 el.width - 205*scale,
						 list_pos + list_item_height * level_ind + list_item_height / 2)

			ctx.fillText(level.best_portals,
						 el.width - 120*scale,
						 list_pos + list_item_height * level_ind + list_item_height / 2)
			ctx.fillText(intToTimeStr(level.best_time),
						 el.width - 35*scale,
						 list_pos + list_item_height * level_ind + list_item_height / 2)
		}
		
		ctx.strokeStyle = '#fff';
		roundedRect(20*scale,20*scale,el.width-40*scale,el.height-40*scale,10*scale)
	}

	draw(mainCanv,chapter);
	return mainCanv
}