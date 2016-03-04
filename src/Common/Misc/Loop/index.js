export function loop(reverseOrder, count_, fn) {
  var count = count_;
  if (reverseOrder) {
    while (count--) {
      fn(count);
    }
  } else {
    for (let i = 0; i < count; i++) {
      fn(i);
    }
  }
}

export default {
  loop,
};
