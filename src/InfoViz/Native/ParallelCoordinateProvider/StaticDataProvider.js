export default class StaticDataProvider {
  constructor(data) {
    this.data = data;
  }

  getParameterList() {
    return Object.getOwnPropertyNames(this.data);
  }

  fetchHistogram(paramOne, paramTwo, callback) {
    var jsonObject = this.data[paramOne][paramTwo];
    callback(jsonObject);
  }
}
