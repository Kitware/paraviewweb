export function loop(reverseOrder, count_, fn) {
  let count = count_;
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
