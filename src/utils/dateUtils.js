function dateFormat(date) {
    if (date) {
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    } else {
      return null;
    }
  
  }
  
  module.exports = { dateFormat };