// --柳世钢--中间文本动画函数
function animate() {
  var textWrapper = document.querySelector('.ml10 .letters');
  // 将选中元素的文本内容中的每个非空白字符替换为一个带有 'letter' 类名的 span 元素
  // 这样做是为了能够对文本中的每个字符进行动画处理
  textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

  // 创建一个动画时间线，loop: true 表示动画会无限循环
  anime.timeline({ loop: true })
    .add({
      targets: '.ml10 .letter',
      // 从 -90 度旋转到 0 度
      rotateY: [-90, 0],
      duration: 1300,
      // 每个元素的动画延迟时间为它的索引值乘以 45 毫秒，这样可以创建一个逐个显示字符的效果
      delay: (el, i) => 45 * i
    })
    .add({
      targets: '.ml10',
      opacity: 0,
      duration: 1000,
      // 使用 "easeOutExpo" 缓动函数，这会创建一个快速开始，然后慢慢结束的动画效果
      easing: "easeOutExpo",
      delay: 1000
    });
}
animate();

// --柳世钢--弹出框输入框的背景色
['recipient-name', 'message-text', 'floatingEmail', 'floatingPassword'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', function () {
    if (this.value.trim() !== '') {
      this.classList.add('bg-white');//增加背景色
    } else {
      this.classList.remove('bg-white');//删除背景色
    }
  });
});