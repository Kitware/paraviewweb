export function loop(reverseOrder, count_, fn) {
  var count = count_;
  if (reverseOrder) {
    while (count) {
      count -= 1;
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
