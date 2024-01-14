

// ---柳世钢---------------------------------------------------------------------------------------------

// 搜索框
var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});

geocoder.on('result', function (e) {
    // 使用 split() 和 pop() 只保留地名的最后一部分
    var shortName = e.result.place_name.split(',').pop();
    // 更新搜索框的内容
    geocoder.setInput(shortName);
});

map.addControl(geocoder);

// 添加旋转缩放控件
map.addControl(new mapboxgl.NavigationControl());
// 添加比例尺控件
map.addControl(new mapboxgl.ScaleControl());
//添加定位
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        // 当激活时，地图将随着设备位置的变化接收更新。
        trackUserLocation: true,
        // 在位置点旁边绘制一个箭头，以指示设备正在前往的方向。
        showUserHeading: true
    })
);

// 面积测量
const draw = new MapboxDraw({
    displayControlsDefault: false,
    // 选择要添加到地图的 mapbox-gl-draw 控制按钮。
    controls: {
        polygon: true, // 多边形
        trash: true // 删除
    },
});
// 将 draw 控制器添加到地图
map.addControl(draw);

// 添加地图的绘制事件监听器
map.on('draw.create', updateArea); // 创建
map.on('draw.delete', updateArea); // 删除
map.on('draw.update', updateArea); // 更新

function updateArea(e) {
    // 获取所有绘制的数据
    const data = draw.getAll();
    const answer = document.getElementById('calculated-area');
    if (data.features.length > 0) {
        // 计算面积
        const area = turf.area(data);
        // 限制面积到 2 位小数点。
        const rounded_area = Math.round(area * 100) / 100;
        // 显示面积
        answer.innerHTML = `<p><strong>${rounded_area}</strong></p><p>平方米</p>`;
    } else {
        // 如果没有绘制的数据，清空显示
        answer.innerHTML = '';
        if (e.type !== 'draw.delete')
            // 如果不是删除操作，提示用户点击地图绘制多边形
            alert('Click the map to draw a polygon.');
    }
}

//--柳世钢---------------------------------------------------------------------------------------------