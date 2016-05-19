var Library = {};
Library.ease = function () {
	this.target = 0;
	this.position = 0;
	this.move = function (target, speed)
	{
		this.position += (target - this.position) * speed;
	}
}

var picNum = 0;
var dim = 0;

var tv = {
	/* 变量定义 */
	O : [],
	screen : {},
	grid : {
		size       : 1,// dim x dim 坐标格
		borderSize : 6,  // 边界大小
		zoomed     : false
	},
	angle : {
		x : new Library.ease(),
		y : new Library.ease()
	},
	camera : {
		x    : new Library.ease(),
		y    : new Library.ease(),
		zoom : new Library.ease(),
		focalLength : 750 // 焦距
	},

	/* 初始化 */
	init : function ()
	{
		this.grid.size = dim;
		this.screen.obj = document.getElementById('screen');
		var img = document.getElementById('bankImages').getElementsByTagName('img');
		if(img.length == 0){
			return;
		}
		this.screen.obj.onselectstart = function () { return false; }
		this.screen.obj.ondrag        = function () { return false; }
		/* 创建图片坐标 */
		var ni = 0;
		var n = (tv.grid.size / 2) - .5;
		for (var y = -n; y <= n; y++)
		{
			for (var x = -n; x <= n; x++)
			{
				/* 创建img元素 ==== */
				var o = document.createElement('img');
				var i = img[(ni++) % img.length];
				o.className = 'tvout';
				o.src = i.src;
				tv.screen.obj.appendChild(o);
				/* 相关3d坐标 */
				o.point3D = {
					x  : x,
					y  : y,
					z  : new Library.ease()
				};
				/* 图片移动 */
				o.point2D = {};
				o.ratioImage = 1;
				tv.O.push(o);
				/* 鼠标悬停的回调 */
				o.onmouseover = function ()
				{
					if (!tv.grid.zoomed)
					{
						if (tv.o)
						{
							/* 鼠标移除时 */
							tv.o.point3D.z.target = 0;
							tv.o.className = 'tvout';
						}
						/* 鼠标悬停时 */
						this.className = 'tvover';
						this.point3D.z.target = -.5;
						tv.o = this;
					}
				}
				/* 单击图片的回调函数 */
				o.onclick = function ()
				{
					if (!tv.grid.zoomed)
					{
						/* 放大图片 */
						tv.camera.x.target = this.point3D.x;
						tv.camera.y.target = this.point3D.y;
						tv.camera.zoom.target = tv.screen.w * 1.25;
						tv.grid.zoomed = this;
					} else {
						if (this == tv.grid.zoomed){
							/* 还原 */
							tv.camera.x.target = 0;
							tv.camera.y.target = 0;
							tv.camera.zoom.target = tv.screen.w / (tv.grid.size + .1);
							tv.grid.zoomed = false;
						}
					}
				}
				/* 3d(是真的么...)变换 */
				o.calc = function ()
				{
					/* 光滑鼠标运动 */
					this.point3D.z.move(this.point3D.z.target, .5);
					/* 为3d坐标赋值 */
					var x = (this.point3D.x - tv.camera.x.position) * tv.camera.zoom.position;
					var y = (this.point3D.y - tv.camera.y.position) * tv.camera.zoom.position;
					var z = this.point3D.z.position * tv.camera.zoom.position;
					/* 旋转 */
					var xy = tv.angle.cx * y  - tv.angle.sx * z;
					var xz = tv.angle.sx * y  + tv.angle.cx * z;
					var yz = tv.angle.cy * xz - tv.angle.sy * x;
					var yx = tv.angle.sy * xz + tv.angle.cy * x;
					/* 图像动画 */
					this.point2D.scale = tv.camera.focalLength / (tv.camera.focalLength + yz);
					this.point2D.x = yx * this.point2D.scale;
					this.point2D.y = xy * this.point2D.scale;
					this.point2D.w = Math.round(
					                   Math.max(
					                     0,
					                     this.point2D.scale * tv.camera.zoom.position * .8
					                   )
					                 );
					/* 图片大小比例 */
					if (this.ratioImage > 1)
						this.point2D.h = Math.round(this.point2D.w / this.ratioImage);
					else
					{
						this.point2D.h = this.point2D.w;
						this.point2D.w = Math.round(this.point2D.h * this.ratioImage);
					}
				}
				/* 渲染部分 */
				o.draw = function ()
				{
					if (this.complete)
					{
						/* 加载图片 */
						if (!this.loaded)
						{
							if (!this.img)
							{
								/* 持有图片的引用 */
								this.img = new Image();
								this.img.src = this.src;
							}
							if (this.img.complete)
							{
								/* 获取长宽比 */
								this.style.visibility = 'visible';
								this.ratioImage = this.img.width / this.img.height;
								this.loaded = true;
								this.img = false;
							}
						}
						/* DOM渲染 */
						this.style.left = Math.round(
						                    this.point2D.x * this.point2D.scale +
						                    tv.screen.w - this.point2D.w * .5
						                  ) + 'px';
						this.style.top  = Math.round(
						                    this.point2D.y * this.point2D.scale +
						                    tv.screen.h - this.point2D.h * .5
						                  ) + 'px';
						this.style.width  = this.point2D.w + 'px';
						this.style.height = this.point2D.h + 'px';
						this.style.borderWidth = Math.round(
						                           Math.max(
						                             this.point2D.w,
						                             this.point2D.h
						                           ) * tv.grid.borderSize * .01
						                         ) + 'px';
						this.style.zIndex = Math.floor(this.point2D.scale * 100);
					}
				}
			}
		}
		/* 开始循环脚本 */
		tv.resize();
		mouse.y = tv.screen.y + tv.screen.h;
		mouse.x = tv.screen.x + tv.screen.w;
		tv.run();
	},

	/* 重置页面大小 */
	resize : function ()
	{
		var o = tv.screen.obj;
		tv.screen.w = o.offsetWidth / 2;
		tv.screen.h = o.offsetHeight / 2;
		tv.camera.zoom.target = tv.screen.w / (tv.grid.size + .1);
		for (tv.screen.x = 0, tv.screen.y = 0; o != null; o = o.offsetParent)
		{
			tv.screen.x += o.offsetLeft;
			tv.screen.y += o.offsetTop;
		}
	},

	/* 最重要的地方 */
	run : function ()
	{
		/* 使动态特效更光滑 */
		tv.angle.x.move(-(mouse.y - tv.screen.h - tv.screen.y) * .0025, .1);
		tv.angle.y.move( (mouse.x - tv.screen.w - tv.screen.x) * .0025, .1);
		tv.camera.x.move(tv.camera.x.target, tv.grid.zoomed ? .25 : .025);
		tv.camera.y.move(tv.camera.y.target, tv.grid.zoomed ? .25 : .025);
		tv.camera.zoom.move(tv.camera.zoom.target, .05);
		/* 好吧，一堆角度值... */
		tv.angle.cx = Math.cos(tv.angle.x.position);
		tv.angle.sx = Math.sin(tv.angle.x.position);
		tv.angle.cy = Math.cos(tv.angle.y.position);
		tv.angle.sy = Math.sin(tv.angle.y.position);
		/* 遍历每张图片 */
		for (var i = 0, o; o = tv.O[i]; i++)
		{
			o.calc();
			o.draw();
		}
		/* 这里其实用setInterval更好.... */
		setTimeout(tv.run, 32);
	}
}

/* -指针坐标- */
var mouse = {
	x : 0,
	y : 0
}
document.onmousemove = function(e)
{
	if (window.event) e = window.event;
	mouse.x = e.clientX;
	mouse.y = e.clientY;
	return false;
}



function readSelectedFiles() {
	
	if(document.getElementById("bankImages").childElementCount != 0){
		alert("removing");
		document.getElementById("bankImages").innerHTML = "";
		tv.screen.obj.innerHTML="";
	}
	
	// FileList
    var files = document.getElementById("tizenFiles").files;
    if (files.length === 0) return;

	picNum = files.length;
	dim = Math.ceil(Math.sqrt(picNum));
	alert(dim);

	var div = document.getElementById('selectedFileInfoList');
	
    var html = [];
    
    

    for (var i = 0; i < files.length; i++) 
    {
        var file = files[i];

        var reader = new FileReader();

        /* Check whether the file is an image */
        if (!file.type.match("image/*")) 
        {
            continue;
        }

        reader.onload =  function(e) 
        { 
            var img = document.createElement("img");
            img.width=200;
            img.src = e.target.result; 
			
            /* Set the selected image's dataURL */     
            img.title = escape(file.name);
            img.className = "img";

            document.getElementById("bankImages").appendChild(img);	
        };
 
        reader.readAsDataURL(file);
    }   
    
    setTimeout(done,500);
}

var done = function(){	
	onresize = tv.resize;
	tv.init();
}
