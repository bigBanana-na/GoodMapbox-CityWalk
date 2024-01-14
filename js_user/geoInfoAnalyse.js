// 主要功能：数据导入、数据源管理、POI信息查询、计算并绘制自定义线路周围的POI数量、线路纠正、热力图绘制
// 该代码80%（主体部分）由ChatGPT4完成，20%部分（微调代码＆debug）由本人完成
// All rights reserved@2024.01.13:2021104010 叶垚森，特别标注部分由2021104001柳世刚完成


// 前置准备
// 创建侧边栏（用于数据源管理）
var menu_btn = document.querySelector("#menu-btn");
var sidebar = document.querySelector("#sidebar");
var side_container = document.querySelector(".my-container");
menu_btn.addEventListener("click", () => {
    sidebar.classList.toggle("active-nav");
    side_container.classList.toggle("active-cont");
});
// 用于创建POI信息弹出窗口
var popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true
});


// 处理文件更新后数据源管理处的列表
// 判断数据源是否应该被显示
function toggleDataSourceVisibility(fileName, isVisible) {
    sourceId = sourceIdsContainer[fileName];
    const layerIds = sourceToLayersMap[sourceId] || [];
    layerIds.forEach(layerId => {
        console.log(layerId)
        map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        // -----柳世钢--对于深圳市shp需要额外处理，让其点击边界也随其变化
        if (layerId === 'district-layer') {
            map.setLayoutProperty('highlighted-district', 'visibility', 'none');
        }
        // -----柳世钢--对于深圳市shp需要额外处理，让其点击边界也随其变化
        console.log('已切换显示');
    });
}
// 更新数据源列表
function updateFileList() {
    const fileListContainer = document.getElementById('file-list');
    fileListContainer.innerHTML = ''; // 清空现有列表

    for (const fileName in sourceIdsContainer) {
        if (sourceIdsContainer.hasOwnProperty(fileName)) {
            // 创建一个包含文件名和复选框的容器
            const listItem = document.createElement('div');
            listItem.className = 'file-list-item';
            // 创建复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'checkbox-' + fileName;
            checkbox.checked = true;
            checkbox.onchange = function () {
                toggleDataSourceVisibility(fileName, this.checked);
            };
            // 创建标签
            const label = document.createElement('label');
            label.htmlFor = 'checkbox-' + fileName;
            label.textContent = '  ' + fileName;
            // 将复选框和标签添加到列表项
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            fileListContainer.appendChild(listItem);
        }
    }
}


// 绘制自定义线路周围的POI数量
// 在网页初始化时，绘制一个缺省的图表
var chartDom = document.getElementById('poiDensityChart');
var myChart = echarts.init(chartDom);
var option;
document.addEventListener('DOMContentLoaded', function () {
    drawPOIDensityChart({}); // 传递一个空对象作为默认数据
});
// 绘制POI密度图表核心函数
function drawPOIDensityChart(data) {
    option = {
        title: {
            text: 'POI Density',
            left: 'center',
            textStyle: {
                textshadow: '-1px 0 white,0 1px white, 1px 0 white, 0 -1px white',
            }
        },
        xAxis: {
            type: 'category',
            data: Object.keys(data),
            axisLabel: {
                rotate: 30, // 轻微旋转标签
                interval: 0 // 显示所有标签
            }
        },
        yAxis: {
            type: 'value',
            min: 0,     // 最小值
            max: 12,    // 最大值
            interval: 3 // 刻度间隔
        },
        series: [{
            data: Object.values(data),
            type: 'bar',
            label: {
                show: true,
                position: 'top',
                color: 'white',
                formatter: '{c}'
            }
        }]
    };
    myChart.setOption(option);
}


// 计算点到线路的最短距离
// 用于存储线路数据的全局数组
var mylines = [];
// 寻找最近的线路
function findNearestLine(poi) {
    var nearestLine;
    var minDistance = Infinity;
    // 假设 lines 是你的线路数据集合
    mylines.forEach(function (line) {
        var distance = turf.pointToLineDistance(poi, line);
        if (distance < minDistance) {
            minDistance = distance;
            nearestLine = line;
        }
    });
    return nearestLine;
}
// 规划到线路的最短路径
function planRoute(poi, line) {
    var nearestPointOnLine = turf.nearestPointOnLine(line, poi);
    return turf.lineString([poi.geometry.coordinates, nearestPointOnLine.geometry.coordinates]);
}
// 在地图上绘制路径并标注距离
function drawRoute(route) {
    if (map.getSource('route')) {
        map.getSource('route').setData(route);
    } else {
        map.addSource('route', {
            type: 'geojson',
            data: route
        });
        if(map.getLayer('route')){
            return;
        }
        map.addLayer({
            id: 'route', 
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#888',
                'line-width': 8
            }
        });
    }
}



// --------------------------------------叶垚森，路线纠正
// 对纠正后的路线信息进行解码（Encoded Polyline Algorithm Format编码）
function decodePolyline(encoded) {
    var points = polyline.decode(encoded);
    var coordinates = points.map(point => {
        return [point[1], point[0]]; // 转换为 [经度, 纬度] 格式
    });
    return coordinates;
}
function correctPathWithMapMatching(feature, lineId, sourceId, color) {
    var allCoordinates = [];
    var coordinates = feature.geometry.coordinates.map(coord =>
        coord.map(c => c.toFixed(5)).join(',')).join(';');
    var mapboxAccessToken = 'pk.eyJ1IjoibGxsbHkxMjEzOCIsImEiOiJjbHJhbGZsNmMwZWdoMmpycGxvd25qeDc3In0.Xjolzylmh7WYifuDBvR1ew';
    var url = 'https://api.mapbox.com/matching/v5/mapbox/walking/' + coordinates +
        '?access_token=' + mapboxAccessToken;
    // console.log(coordinates)
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.code != 'Ok') {
                alert("Failed to Correct lines!")
                return;
            }
            // console.log(data.matchings[0])
            data.matchings.forEach(matching => {
                var decodedRoute = decodePolyline(matching.geometry); // 解码每段路线
                allCoordinates.push(...decodedRoute); // 将解码后的坐标添加到数组
            });
            // 重构geojson用于绘制
            var geojson = {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': allCoordinates // 从 decodePolyline 函数返回的坐标数组
                }
            };
            // 将纠正后的路线添加到地图上
            map.getSource(sourceId).setData(geojson);
            map.addLayer({
                id: lineId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': color,
                    'line-width': 8
                },
            });
            console.log("Correct lines with success!")
        }).catch(error => console.error('Error:', error));
}


// 导入geojson数据
// 全局容器，用于存储每个文件名（geojson）对应的唯一ID
const sourceIdsContainer = {};
// 全局Id，用于存储每个自定义路线的Id
let lineCounter = 0;
// 全局映射，用于从数据源映射到对应的图层列表
const sourceToLayersMap = {};
// 全局POI类型
const poiTypes = [
    "餐饮服务", "风景名胜", "公共设施",
    "购物服务", "交通设施服务", "科教文化服务",
    "商务住宅", "体育休闲服务", "住宿服务"
];
// 用于为每个数据源生成唯一的哈希值
function generateHash(str) {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
// 用于添加数据源的函数
function addSource(map, fileName, geoJsonData) {
    const sourceId = 'source-' + generateHash(fileName).toString();
    // 添加数据源
    map.addSource(sourceId, {
        type: 'geojson',
        data: geoJsonData
    });
    // 将文件名与对应的 ID 存储在全局容器中
    sourceIdsContainer[fileName] = sourceId;
    updateFileList();
    return sourceId;
}
// 读取load按钮的句柄，每次load进file的时候执行handleFiles
var inputElement = document.getElementById("files");
inputElement.addEventListener("change", handleFiles, false);
// 用于清除点到线距离的路线
map.on('click', function (e) {
    if (map.getLayer('route')) {
        map.removeLayer('route');
        map.removeSource('route');
    }
    console.log('666');
});
// --柳世钢实现读取OSM路线与行政区划文件逻辑与promise操作、解析行政区划、点击边界高亮显示-------
// --其余部分由叶垚森实现-----------------------------------------------
function handleFiles() {
    var selectedFile = document.getElementById("files").files[0];    //获取读取的File对象
    var name = selectedFile.name;                                    //读取选中文件的文件名
    var size = selectedFile.size;                                    //读取选中文件的大小
    console.log("文件名:" + name + "大小：" + size);

    // 创建一个新的 Promise
    const promise = new Promise(function (resolve, reject) {
        // 读取文件信息
        var reader = new FileReader();
        reader.readAsText(selectedFile); //读取文件的内容
        reader.onload = function () {
            // 判断是否能够打开文件
            if (this.result) {
                console.log("读取结果：", this.result);
                resolve(this.result); // 如果成功，调用 resolve
            } else {
                console.log("读取失败");
                reject("读取失败"); // 如果失败，调用 reject
            }
        };
    });
    // 使用 then 处理 Promise 的结果
    promise.then(function (result) {
        let geojsonData = JSON.parse(result);
        console.log(geojsonData);
        sourceId = addSource(map, name, geojsonData); //添加数据源
        console.log("数据加载完成"); // 提示数据加载完成
        // 定义生成随机颜色的辅助函数
        function getRandomColor() {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        // 判断要素的类型，支持OSM的分类字段
        const geometryType = geojsonData.features[0].geometry.type.toLowerCase();
        if (geometryType === 'point') {   // OSM的点
            const icons = {
                "餐饮服务": "restaurant",
                "风景名胜": "park",
                "公共设施": "marker",
                "购物服务": "shop",
                "交通设施服务": "bus",
                "科教文化服务": "library",
                "商务住宅": "lodging",
                "体育休闲服务": "pitch",
                "住宿服务": "lodging"
            };
            poiTypes.forEach(type => {
                map.addLayer({
                    id: type,
                    type: 'symbol',
                    source: sourceId,
                    layout: {
                        'icon-image': icons[type], // 使用相应类型的图标
                        'icon-size': 1.5, // 调整图标大小
                        'icon-allow-overlap': false // 允许图标重叠
                    },
                    paint: {},
                    filter: ['==', 'type', type]  // 只显示对应类型的线条
                });
                if (!sourceToLayersMap[sourceId]) {
                    sourceToLayersMap[sourceId] = [];
                }
                sourceToLayersMap[sourceId].push(type);
                // 绘制热力图
                map.addLayer({
                    id: 'heatmap-' + type,
                    type: 'heatmap',
                    source: sourceId,
                    maxzoom: 14,
                    paint: {
                        // 增加热力权重以强调密度
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 0.5,
                            9, 1
                        ],
                        // 热力图颜色渐变
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(33,102,172,0)',
                            0.2, 'rgb(103,169,207)',
                            0.4, 'rgb(209,229,240)',
                            0.6, 'rgb(253,219,199)',
                            0.8, 'rgb(239,138,98)',
                            1, 'rgb(178,24,43)'
                        ],
                        // 调整热力图点的半径
                        'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 2,
                            9, 20
                        ],
                        // 调整热力图的不透明度
                        'heatmap-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            7, 1,
                            9, 0.5
                        ],
                    },
                    filter: ['==', ['get', 'type'], type] // 确保只显示当前 POI 类型的数据
                });
                if (!sourceToLayersMap[sourceId]) {
                    sourceToLayersMap[sourceId] = [];
                }
                sourceToLayersMap[sourceId].push('heatmap-' + type);

                // 设置监听器，若鼠标点击某个POI点，可以查询到POI的信息以及与当前最近路线之间的距离
                map.on('click', type, function (e) {
                    console.log(type);
                    var poi = e.features[0];
                    var nearestLine = findNearestLine(poi);
                    var poiName = poi.properties.name;
                    var field4 = poi.properties.Field4;
                    var distance = turf.pointToLineDistance(poi, nearestLine, { units: 'meters' });
                    distance = distance.toFixed(0); // 保留整数
                    // 输出信息
                    popup.setLngLat(poi.geometry.coordinates)
                        .setHTML('<div style="color: black;"><h5>' + poiName + '</h5><p>' + field4 + '</p></div>' +
                            '<div style="color: black;"><p>   Distance to nearest line: ' + distance + ' m</p></div>')
                        .addTo(map);
                    // 计算距离
                    var route = planRoute(poi, nearestLine);
                    drawRoute(route); // 在地图上绘制距离
                });
            });
        }else if (geometryType === 'linestring') {
            // --柳世钢--检查 GeoJSON 数据对象的数量,解析城市道路网--用于导入OSM路线
            if (geojsonData.features.length > 500) {
                console.log('数据大于100');
                const types = ["城市次干道", "城市快速路", "高速公路", "城市主干道"];
                const colors = ["#FF0000", "#00FF00", "#FF00FF", "#FFFF00", "#00FFFF"];
                types.forEach((type, index) => {
                    map.addLayer({
                        id: type,
                        type: 'line',
                        source: sourceId,
                        layout: {},
                        paint: {
                            'line-color': colors[index] || colors[colors.length - 1], // 使用对应的颜色，如果没有对应的颜色，使用最后一个颜色
                            'line-width': 7
                        },
                        filter: ['==', 'type', type] // 只显示对应类型的线条
                    });
                    if (!sourceToLayersMap[sourceId]) {
                        sourceToLayersMap[sourceId] = [];
                    }
                    sourceToLayersMap[sourceId].push(type);
                });
            }else{  //--叶垚森--用于导入自定义路线
                geojsonData.features.forEach((feature) => {
                    const color = getRandomColor(); // 生成随机颜色
                    const lineId = `line-${lineCounter++}`;
                    // 将线路 GeoJSON 数据添加到 mylines 数组
                    mylines.push(feature);
                    correctPathWithMapMatching(feature, lineId, sourceId, color);
                    if (!sourceToLayersMap[sourceId]) {
                        sourceToLayersMap[sourceId] = [];
                    }
                    sourceToLayersMap[sourceId].push(lineId);
                    // POI密度计算
                    map.on('click', lineId, function (e) {
                        var buffer = turf.buffer(e.features[0], 200, { units: 'meters' });
                        // 统计缓冲区内各类 POI 的数量
                        var counts = {}; // 用于存储每种类型的计数
                        poiTypes.forEach(type => counts[type] = 0);
                        map.queryRenderedFeatures({
                            layers: poiTypes
                        }).forEach(function (feature) {
                            if (turf.inside(feature, buffer)) {
                                counts[feature.properties.type] += 1;
                            }
                        });
                        // 计算POI密度
                        var densities = {};
                        Object.keys(counts).forEach(type => {
                            densities[type] = counts[type]; // 单位为：个每200米的缓冲区
                        });
                        drawPOIDensityChart(densities);
                    });
                });
            }
        } else if (geometryType === 'polygon') {   // 导入深圳市行政区划
            // -----------------------------------------柳世钢，深圳市行政区划数据
            map.addLayer({
                id: 'district-layer',
                type: 'fill',
                source: sourceId,
                layout: {},
                paint: {
                    'fill-opacity': 0.8,
                    'fill-color': [
                        'match',
                        ['get', 'DISTRICT'],
                        '宝安区', '#5E82C2',
                        '大鹏新区', '#95EF8D',
                        '福田区', '#00A4DB',
                        '光明新区', '#f1c40f',
                        '龙岗区', '#2ecc71',
                        '龙华新区', '#3498db',
                        '罗湖区', '#9b59b6',
                        '南山区', '#34495e',
                        '坪山新区', '#16a085',
                        '盐田区', '#27ae60',
                        '#ccc'  // default color
                    ]
                }
            });
            // 将资源id传入管理器
            layerId = 'district-layer';

            if (!sourceToLayersMap[sourceId]) {
                sourceToLayersMap[sourceId] = [];
            }
            sourceToLayersMap[sourceId].push(layerId);

            // 当鼠标移动到图层上时，改变鼠标样式为箭头
            map.on('mousemove', layerId, function () {
                map.getCanvas().style.cursor = 'default';
            });

            // 当鼠标离开图层时，改变鼠标样式为默认样式
            map.on('mouseleave', layerId, function () {
                map.getCanvas().style.cursor = '';
            });

            // 当用户点击图层时，其各对象边界高亮显示
            map.on('click', 'district-layer', function (e) {

                // 获取被点击的特性的属性
                var properties = e.features[0].properties;

                // 创建一个新的 Popup
                new mapboxgl.Popup()
                    // 设置 Popup 的位置
                    .setLngLat(e.lngLat)
                    // 设置 Popup 的内容
                    .setHTML('<h3 style="color: black !important; font-size: 13px;">' + properties.DISTRICT + '</h3>')
                    // 添加 Popup 到地图上
                    .addTo(map);

                // 设置被点击的特性的样式
                map.setPaintProperty('district-layer', 'fill-outline-color', '#ff0000');
                map.setPaintProperty('district-layer', 'fill-opacity', 0.8);

                // 如果已经存在一个 'highlighted-district' 图层，就先移除它
                if (map.getLayer('highlighted-district')) {
                    map.removeLayer('highlighted-district');
                }

                // 如果 'highlighted-district' 图层不存在，就先创建它
                if (!map.getLayer('highlighted-district')) {
                    map.addLayer({
                        id: 'highlighted-district',
                        type: 'line',
                        source: sourceId,
                        layout: {},
                        paint: {
                            'line-color': '#ff0000',
                            'line-width': 3
                        },
                        'filter': ['==', 'DISTRICT', properties.DISTRICT]
                    });
                }

                // 然后再设置样式
                map.setPaintProperty('highlighted-district', 'line-width');

                // 创建一个动画来增加被点击的特性的大小
                var start = Date.now();
                var animate = function () {
                    var t = (Date.now() - start) / 1000;

                    // 更新被点击的特性的大小
                    map.setPaintProperty('highlighted-district', 'line-width', 3 * 1.2 * t);

                    // 如果动画还没有结束，继续动画
                    if (t < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                // 开始动画
                animate();
            });
            // -----------------------------------------柳世钢，深圳市行政区划数据
        } else {
            console.log('未知几何类型');
        }
    }).catch(function (error) {
        console.log("处理文件时出错：", error);
    });
}

