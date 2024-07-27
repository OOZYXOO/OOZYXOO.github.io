var box = document.getElementsByClassName("box")[0],
	sy = document.getElementsByClassName("sy")[0],
	dialogsz = document.getElementsByClassName("dialog")[0],
	qd = document.getElementsByClassName("button")[0],
	ts1 = document.getElementsByClassName("ts")[0],
	ts2 = document.getElementsByClassName("ts")[1],
	iptmapsize1 = document.getElementsByClassName("mapsize")[0],
	iptmapsize2 = document.getElementsByClassName("mapsize")[1],
	iptdlgs = document.getElementsByClassName("dlgs")[0],
	dialogsy = document.getElementsByClassName("dialogsy")[0],
	h1 = dialogsy.children[0],
	fhsy = dialogsy.children[1],
	zlyj = dialogsy.children[2],
	ksyxs = document.getElementsByClassName("ksyx")[0],
	ksyx = ksyxs.children[0],
	sz = ksyxs.children[1],
	ul = box.children,
	keycount = 0,
	mapsize = 10,
	slmap = [],
	minecount = 20,
	mine = {},
	szkey1 = 1,
	szkey2 = 1;

//在二维数组中生成地图
function chuangJianMap(){
	for (var i = 0;i < mapsize;i ++){
		slmap[i] = [];
		for (var j = 0;j < mapsize;j ++){
			slmap[i][j] = 0;
		}
	}
}
//指定范围的随机数
function random(x,y){return Math.floor(Math.random() * (y + 1)) + x;}
//在二维数组中生成的地图里埋雷
function ml(count){
	var k = 0;
	while (k != count && count <= mapsize * mapsize){
		var x = random(0,mapsize - 1);
		var y = random(0,mapsize - 1);
		if (mine["" + x + y] === undefined){
			mine["" + x + y] = [x,y];
			slmap[y][x] = "雷";
			for (var i = -1;i < 2;i ++){
				for (var j = -1;j < 2;j ++){
					if (slmap[y + i] !== undefined && slmap[y + i][x + j] !== undefined && slmap[y + i][x + j] !== "雷"){
						slmap[y + i][x + j] ++;
					}
				}
			}
			k ++;
		}
	}
}
//生成小格子
function chuangJianMinBoxs(){
	box.innerHTML = "";
	for (var i = 0;i < mapsize;i ++){
		var ul = document.createElement("ul");
		box.appendChild(ul);
		for (var j = 0;j < mapsize;j ++){
			var li = document.createElement("li");
			ul.appendChild(li);
			li.setAttribute("Xwz","" + j);
			li.setAttribute("Ywz","" + i);
//			li.innerHTML = slmap[i][j]																															//																																															取消注释直接查看地图
		}
		
	}

}
//点击到0,展开四周并扩散
var kscount = 0;
function kuoSan(box0){
	var Xwz = parseInt(box0.getAttribute("Xwz"));
	var Ywz = parseInt(box0.getAttribute("Ywz"));
	for (var i = -1;i < 2;i ++){
		if (ul[Ywz + i] === undefined){
			continue;
		}
		var lis = ul[Ywz + i].children;
		for (var j = -1;j < 2;j ++){
			var li = lis[Xwz + j];
			if (li === undefined || li.getAttribute("key") == 1 || li.getAttribute("qi") == 1){
				continue;
			}
			li.style.background = "#fff";
			li.setAttribute("key","" + 1);
			if (kscount === 7000){
				
			}else if (slmap[Ywz + i][Xwz + j] == 0){
				kscount ++;
				kuoSan(li);
			}else{
				li.innerHTML = slmap[Ywz + i][Xwz + j];
			}
//			li.innerHTML = slmap[Ywz + i][Xwz + j];
			keycount ++;
			if (keycount == mapsize * mapsize - minecount){
				yl();
//				alert("你赢了！")
			}

		}	
		
	}
}
//赢了
function yl(){
	h1.innerHTML = "恭喜你，赢了";
	dialogsy.showModal();
}
//输了
function sl(){
	h1.innerHTML = "恭喜你，<span>输</span>啦!!";
	var span = h1.children[0];
	console.log(span);
	slbs = setInterval(function (){
		span.style.color = "rgb(" + random(0,255) + "," + random(0,255) + "," + random(0,255) + ")";
	},10)
	dialogsy.showModal();
}

//box的mousedown事件
function boxMousedown(e){
	var mouse = e.button;
	var clickLi = e.srcElement;
	if (mouse == 0 && clickLi.getAttribute("qi") != 1 && clickLi.getAttribute("key") != 1){
		var Xwz = parseInt(clickLi.getAttribute("Xwz"));
		var Ywz = parseInt(clickLi.getAttribute("Ywz"));
//		clickLi.innerHTML = slmap[Ywz][Xwz];
		clickLi.style.background = "#fff";
		if (slmap[Ywz][Xwz] == 0){
			kuoSan(clickLi);
			kscount = 0;
		}
		else if (slmap[Ywz][Xwz] === "雷"){
			clickLi.innerHTML = slmap[Ywz][Xwz];
			sl();
//			alert("游戏结束！");
		}else{
			clickLi.setAttribute("key","1");
			clickLi.innerHTML = slmap[Ywz][Xwz];
			keycount ++;
			if (keycount == mapsize * mapsize - minecount){
				yl();
//				alert("你赢了！")
			}
		}
	}else if (mouse == 2 && clickLi.getAttribute("key") != 1){
		if (clickLi.getAttribute("qi") != 1){
			clickLi.className = "qi";
			clickLi.setAttribute("qi","1");
		}else{
			clickLi.removeAttribute("class");
			clickLi.setAttribute("qi","0");
		}
	}
}
//ksyx的click事件
function ksyxClick(){
	sy.style.display = "none";
	chuangJianMap();
	ml(minecount);
	chuangJianMinBoxs();
	box.addEventListener("mousedown",boxMousedown);
	fhsy.addEventListener("click",fhsyClick);
	zlyj.addEventListener("click",zlyjClick);
	sz.removeEventListener("click",szClick);
	ksyx.removeEventListener("click",ksyxClick);
}
//sz的click事件
function szClick(){
	dialogsz.setAttribute("open","open");
	iptmapsize1.value = mapsize;
	iptmapsize2.value = mapsize;
	iptdlgs.value = minecount;
	iptmapsize1.addEventListener("input",iptmapsize1Input);
	iptmapsize2.addEventListener("input",iptmapsize2Input);
	iptdlgs.addEventListener("input",iptdlgsInput);
	qd.addEventListener("click",qdClick);
}
//qd的click事件
function qdClick(){
	dialogsz.removeAttribute("open");
	iptmapsize1.removeEventListener("input",iptmapsize1Input);
	iptmapsize2.removeEventListener("input",iptmapsize2Input);
	iptdlgs.removeEventListener("input",iptdlgsInput);
	qd.removeEventListener("click",qdClick);

}
//iptmapsize1的input事件
function iptmapsize1Input(){
	iptmapsize2.value = this.value;
	mapsize = parseInt(this.value) || 0;
	if (mapsize <= 0){
		ts1.innerHTML = "注意：地图大小只能为正数！";
		ts1.style.opacity = "1";
		szkey1 = 0;
	}else if (mapsize > 86){
		ts1.innerHTML = "注意：地图过大，会影响游戏体验！";
		ts1.style.opacity = "1";
		szkey1 = 1;
	}else{
		ts1.style.opacity = "0";
		szkey1 = 1;
	}
	if (szkey1 && szkey2){
		qd.addEventListener("click",qdClick);
	}else{
		qd.removeEventListener("click",qdClick);
	}
}
//iptmapsize2的input事件
function iptmapsize2Input(){
	iptmapsize1.value = this.value;
	mapsize = parseInt(this.value) || 0;
	if (mapsize <= 0){
		ts1.innerHTML = "注意：地图大小只能为正数！";
		ts1.style.opacity = "1";
		szkey1 = 0;
	}else if (mapsize > 86){
		ts1.innerHTML = "注意：地图过大，会影响游戏体验！";
		ts1.style.opacity = "1";
		szkey1 = 1;
	}else{
		ts1.style.opacity = "0";
		szkey1 = 1;
	}
	if (szkey1 && szkey2){
		qd.addEventListener("click",qdClick);
	}else{
		qd.removeEventListener("click",qdClick);
	}
}
//iptdlgs的input事件
function iptdlgsInput (){
	minecount = parseInt(this.value) || 0;
	if (minecount < 0){
		ts2.innerHTML = "注意：地雷个数不能为负数！";
		ts2.style.opacity = "1";
		szkey2 = 0;
	}else if (minecount == 0){
		ts2.innerHTML = "要脸吗？不埋雷？";
		ts2.style.opacity = "1";
		szkey2 = 1;
	}else if(minecount > mapsize * mapsize){
		ts2.innerHTML = "地雷数量不得大于地图大小";
		ts2.style.opacity = "1";
		szkey2 = 0;
	}else{
		ts2.style.opacity = "0";
		szkey2 = 1;
	}
	if (szkey1 && szkey2){
		qd.addEventListener("click",qdClick);
	}else{
		qd.removeEventListener("click",qdClick);
	}
}
//fhsy的click事件
function fhsyClick(){
	box.innerHTML = "";
	mine = {};
	if(h1.children.length){clearInterval(slbs);}
	dialogsy.close();
	keycount = 0;
	sy.style.display = "block";
	box.removeEventListener("mousedown",boxMousedown);
	fhsy.removeEventListener("click",fhsyClick);
	zlyj.removeEventListener("click",zlyjClick);
	ksyx.addEventListener("click",ksyxClick);
	sz.addEventListener("click",szClick);
}
//zlyj的click事件
function zlyjClick(){
//	box.innerHTML = "";
	mine = {};
	if(h1.children.length){clearInterval(slbs);}
	dialogsy.close();
	keycount = 0;
	ksyxClick();
}
ksyx.addEventListener("click",ksyxClick);
sz.addEventListener("click",szClick);
document.oncontextmenu = function (){
    return false;
}
document.onkeydown = function(e){
//	console.log(e);
	if (e.code == "F12" || e.code == "KeyI"){
		sy.innerHTML = "不许调控制台";
    	return false;
	}
}
//sl()
