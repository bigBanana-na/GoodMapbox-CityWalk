// 1. 深圳市气温
option_SZweather = {
    title: {//标题
        text: '深圳年晴雨天气分布图',
        subtext: 'From TianQi24',
        left: 'center',
        textStyle: {
            color: '#1892EB',
        }
    },
    tooltip: {//提示框组件
        trigger: 'item'
    },
    legend: {//图例
        orient: 'horizontal',
        textStyle: {
            color: 'var(--bs-body-color)',
        },
        left: 'left',
        bottom: 0,
    },
    series: [//系列列表
        {
            name: 'Access From',
            type: 'pie',
            radius: '50%',// 缩小饼图
            data: [
                { value: 49, name: '阴' },
                { value: 143, name: '多云' },
                { value: 121, name: '雨' },
                { value: 63, name: '晴' },
            ],
            label: {
                color: '#1892EB'  // 根据主题设置文字颜色
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }
    ]
};

// 2.气温折柱混合图
option_Weather = {
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
            crossStyle: {
                color: '#999'
            }
        }
    },
    toolbox: {
        feature: {
            dataView: { show: true, readOnly: false },
            magicType: { show: true, type: ['line', 'bar'] },
            restore: { show: true },
            saveAsImage: { show: true }
        }
    },
    legend: {
        data: ['Evaporation', 'Precipitation', 'Temperature'],
        orient: 'horizontal',
        textStyle: {
            color: 'var(--bs-body-color)',
        },
        left: 'left',
        bottom: 0,
    },
    xAxis: [
        {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            axisPointer: {
                type: 'shadow'
            }
        }
    ],
    yAxis: [
        {
            type: 'value',
            name: 'Precipitation',
            min: 0,
            max: 20,
            interval: 5,
            axisLabel: {
                formatter: '{value} ml'
            }
        },
        {
            type: 'value',
            name: 'Temperature',
            min: 0,
            max: 25,
            interval: 5,
            axisLabel: {
                formatter: '{value} °C'
            }
        }
    ],
    series: [
        {
            name: 'Evaporation',
            type: 'bar',
            tooltip: {
                valueFormatter: function (value) {
                    return value + ' ml';
                }
            },
            data: [
                2.0, 4.9, 7.0, 3.2, 5.6, 7.7, 5.6, 6.2
            ]
        },
        {
            name: 'Precipitation',
            type: 'bar',
            tooltip: {
                valueFormatter: function (value) {
                    return value + ' ml';
                }
            },
            data: [
                2.6, 5.9, 9.0, 6.4, 8.7, 7.7, 15.6
            ]
        },
        {
            name: 'Temperature',
            type: 'line',
            yAxisIndex: 1,
            tooltip: {
                valueFormatter: function (value) {
                    return value + ' °C';
                }
            },
            data: [20.5, 21.5, 20.5, 19.0, 19.0, 20.0, 21.5]
        }
    ]
};

// 3.平均气温左右柱图
const labelRight = {
    position: 'right'
};
option_AvgWeather = {
    title: {
        text: '周平均气温',
        textStyle: {
            color: '#1892EB',
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow',
            crossStyle: {
                color: '#999'
            }
        }

    },
    grid: {
        top: 80,
        bottom: 30
    },
    xAxis: {
        type: 'value',
        position: 'top',
        splitLine: {
            lineStyle: {
                type: 'dashed'
            }
        }
    },
    yAxis: {
        type: 'category',
        axisLine: { show: false },
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        data: [
            'Sun',
            'Sat',
            'Fri',
            'Thu',
            'Wed',
            'Tue',
            'Mon'
        ],
        label: {
            color: '#1892EB'  // 根据主题设置文字颜色
        },
    },
    series: [
        {
            name: '温差',
            type: 'bar',
            stack: 'Total',
            label: {
                show: true,
                formatter: '{b}'
            },
            data: [
                { value: -1, },
                { value: -2 },
                1,
                3,
                { value: -4, },
                2,
                { value: -3, },
                5,
                { value: -1, },
                4
            ],
        }
    ]
};
