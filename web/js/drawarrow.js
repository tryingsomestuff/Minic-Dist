function transform(xy,angle,xy0){
    // put x and y relative to x0 and y0 so we can rotate around that
    const rel_x = xy[0] - xy0[0];
    const rel_y = xy[1] - xy0[1];

    // compute rotated relative points
    const new_rel_x = Math.cos(angle) * rel_x - Math.sin(angle) * rel_y;
    const new_rel_y = Math.sin(angle) * rel_x + Math.cos(angle) * rel_y;

    return [xy0[0] + new_rel_x, xy0[1] + new_rel_y];
}

function draw_arrow(context, x0, y0, x1, y1, width, head_width, head_length){

    // compute length first
    const length = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0))
    let angle  = Math.atan2(y1-y0, x1-x0);
    // adjust the angle by 90 degrees since the arrow we rotate is rotated by 90 degrees
    angle -= Math.PI / 2;

    let p0 = [x0,y0];

    // order will be: p1 -> p3 -> p5 -> p7 -> p6 -> p4 -> p2
    // formulate the two base points
    let p1 = [x0 + width / 2, y0];
    let p2 = [x0 - width / 2, y0];

    // formulate the upper base points which connect the pointy end with the lengthy thing
    let p3 = [x0 + width / 2, y0 + length - head_length];
    let p4 = [x0 - width / 2, y0 + length - head_length];

    // formulate the outter points of the triangle
    let p5 = [x0 + head_width / 2, y0 + length - head_length];
    let p6 = [x0 - head_width / 2, y0 + length - head_length];

    // end point of the arrow
    let p7 = [x0, y0 + length];

    p1 = transform(p1,angle,p0);
    p2 = transform(p2,angle,p0);
    p3 = transform(p3,angle,p0);
    p4 = transform(p4,angle,p0);
    p5 = transform(p5,angle,p0);
    p6 = transform(p6,angle,p0)
    p7 = transform(p7,angle,p0);

    // move to start first
    context.moveTo(p1[0], p1[1]);
    context.beginPath();
    // start drawing the lines
    context.lineTo(p3[0], p3[1]);
    context.lineTo(p5[0], p5[1]);
    context.lineTo(p7[0], p7[1]);
    context.lineTo(p6[0], p6[1]);
    context.lineTo(p4[0], p4[1]);
    context.lineTo(p2[0], p2[1]);
    context.lineTo(p1[0], p1[1]);
    context.closePath();
    context.arc(x0,y0,width/2,angle-Math.PI,angle)
    context.fill();
}

function draw_move(pos,arrow_width_factor=1) {
    let board_elem = document.getElementById('myBoard');
    let positionInfo = board_elem.getBoundingClientRect();
    let board_width = positionInfo.width;

    let canvas = document.getElementById("drawing_canvas");
    let ctx    = canvas.getContext("2d");

    if(ctx === null) return;

    let fromX = pos.charCodeAt(0) - 96;
    let fromY = Number(pos.charAt(1));
    let toX   = pos.charCodeAt(2) - 96;
    let toY   = Number(pos.charAt(3));

    // compute width, center of the board and arrow start and end points
    let b = board_width / 8;
    let c = b / 2;
    let sx = fromX * b - c;
    let sy = board_width - (fromY * b - c);
    let ex = toX * b - c;
    let ey = board_width - (toY * b - c);
    let w  = b / 3.5 * arrow_width_factor;

    ctx.fillStyle = `rgba(120, 120, 120, ${0.8*arrow_width_factor})`;
    draw_arrow(ctx,sx,sy,ex,ey,w,2.5*w,b/1.5);
}

function clear_arrows(){
    let canvas = document.getElementById("drawing_canvas");
    let ctx    = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}