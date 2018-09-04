/**
 * This package provides statistic functions and metrics.
 * The methods work on all numeric arrays that provide a length and [] access.
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

jkjs.stat = function() {
  var that = this;

  function aggregate(arr, init, aggr) {
    var res = init;
    for(var i = 0;i < arr.length;i += 1) {
      if(!isNaN(arr[i])) {
        res = aggr(res, arr[i]);
      }
    }
    return res;
  }

  this.sum = function(arr) {
    return aggregate(arr, 0, function(agg, cur) {
      return agg + cur;
    });
  };

  this.max = function(arr) {
    return aggregate(arr, Number.NEGATIVE_INFINITY, function(agg, cur) {
      return Math.max(agg, cur);
    });
  };

  this.min = function(arr) {
    return aggregate(arr, Number.POSITIVE_INFINITY, function(agg, cur) {
      return Math.min(agg, cur);
    });
  };

  this.minmax = function(arr) {
    if(arr.length == 0) return [ Number.NaN, Number.NaN ];
    if(arr.length == 1) return [ arr[0], arr[0] ];
    // more than one element
    var minmax = arr[0] < arr[1] ? [ arr[0], arr[1] ] : [ arr[1], arr[0] ];
    var ix = 2;
    while(ix < arr.length) {
      var fst = arr[ix];
      ix += 1;
      if(ix >= arr.length) { // fst is last element
        if(fst < minmax[0]) {
          minmax[0] = fst;
        } else if(fst > minmax[1]) {
          minmax[1] = fst;
        }
      } else { // advance 2 elements at a time -- only 3 comparisons needed
        var snd = arr[ix];
        ix += 1;
        var min;
        var max;
        if(fst < snd) {
          min = fst;
          max = snd;
        } else {
          min = snd;
          max = fst;
        }
        if(min < minmax[0]) {
          minmax[0] = min;
        }
        if(max > minmax[1]) {
          minmax[1] = max;
        }
      }
    }
    return minmax;
  };

  this.mean = function(arr) {
    return that.sum(arr) / arr.length;
  };

  this.stddev = function(arr, mean) {
    var m;
    if(arguments.length < 2) {
      m = that.mean(arr);
    } else {
      m = mean;
    }
    return Math.sqrt(aggregate(arr, 0, function(agg, cur) {
      return agg + (cur - m) * (cur - m);
    }) / arr.length);
  };

  function computeDistance(arrA, arrB, dist) {
    if(arrA.length !== arrB.length) {
      console.warn("arrays must have same length", arrA, arrB);
      return Number.NaN;
    }
    var res = 0;
    for(var i = 0;i < arrA.length;i += 1) {
      if(isNaN(arrA[i])) {
        console.warn("no NaN values allowed", arrA, i);
        return Number.NaN;
      }
      if(isNaN(arrB[i])) {
        console.warn("no NaN values allowed", arrB, i);
        return Number.NaN;
      }
      res += dist(arrA[i], arrB[i]);
    }
    return res;
  }

  this.pearson = function(arrA, arrB) {
    var meanA = that.mean(arrA);
    var meanB = that.mean(arrB);
    var stdA = that.stddev(arrA, meanA);
    var stdB = that.stddev(arrB, meanB);
    if(stdA === 0.0 || stdB === 0.0) {
      console.warn("standard deviation is zero", stdA, stdB, meanA, meanB);
      return meanA === meanB ? 0 : 1;
    }
    var sum = computeDistance(arrA, arrB, function(a, b) {
      return (a - meanA) * (b - meanB);
    });
    return sum / stdA / stdB / arrA.length;
  };
  this.KLD = function(arrA, arrB) {
    var lenA = arrA.length;
    var lenB = arrB.length;
    return -computeDistance(arrA, arrB, function(a, b) {
      if(b !=0 && a != 0) {
        return -Math.log(a/lenA/b/lenB)*(a/lenA);
      }
      return 0;
    });
  };

  this.metric = {
    euclid: function(arrA, arrB) {
      return Math.sqrt(computeDistance(arrA, arrB, function(a, b) {
        return (a - b) * (a - b);
      }));
    },
    scaled: function(arrA, arrB) {
      var maxA = that.max(arrA);
      var minA = that.min(arrA);
      var maxB = that.max(arrB);
      var minB = that.min(arrB);
      if(minA >= maxA) {
        console.warn("invalid extent", minA, maxA, arrA);
        return Number.POSITIVE_INFINITY;
      }
      if(minB >= maxB) {
        console.warn("invalid extent", minB, maxB, arrB);
        return Number.POSITIVE_INFINITY;
      }
      return Math.sqrt(computeDistance(arrA, arrB, function(a, b) {
        var sa = (a - minA) / (maxA - minA);
        var sb = (b - minB) / (maxB - minB);
        return (sa - sb) * (sa - sb);
      }));
    },
    pearson: function(arrA, arrB) {
      return 1 - Math.abs(that.pearson(arrA, arrB));
    }
  };

  this.edit_distances = {
    levenshtein: function(arrA, arrB) {
      if(arrA === arrB) return 0;
      if(!arrA.length) return arrB.length;
      if(!arrB.length) return arrA.length;
      if(arrA.length < arrB.length) return that.edit_distances.levenshtein(arrB, arrA); // use shorter array as arrB to reduce memory

      var v0 = new Int32Array(arrB.length + 1);
      var v1 = new Int32Array(arrB.length + 1);
      for(var ix = 0;ix < v0.length;ix += 1) {
        v0[ix] = ix;
      }

      for(var ix = 0;ix < arrA.length;ix += 1) {
        v1[0] = ix + 1;
        for(var k = 0;k < arrB.length;k += 1) {
          var cost = arrA[ix] == arrB[k] ? 0 : 1;
          v1[k + 1] = Math.min(
                        v1[k] + 1, // insert
                        v0[k + 1] + 1, // delete
                        v0[k] + cost // replace / equal
                      );
        }
        for(var k = 0;k < v0.length;k += 1) {
          v0[k] = v1[k];
        }
      }
      return v1[arrB.length];
    },
    hamming: function(arrA, arrB) {
      if(arrA === arrB) return 0;
      if(arrA.length > arrB.length) return that.edit_distances.hamming(arrB, arrA);
      // arrA is shorter
      var dist = 0;
      for(var ix = 0;ix < arrA.length;ix += 1) {
        if(arrA[ix] != arrB[ix]) {
          dist += 1;
        }
      }
      for(var ix = arrA.length;ix < arrB.length;ix += 1) {
        if(arrB[ix]) {
          dist += 1;
        }
      }
      return dist;
    },
    jaccard: function(arrA, arrB) {
      if(arrA === arrB) return 0;
      if(arrA.length > arrB.length) return that.edit_distances.jaccard(arrB, arrA);
      // arrA is shorter
      var cap = 0;
      var cup = 0;
      for(var ix = 0;ix < arrA.length;ix += 1) {
        if(arrA[ix] && arrB[ix]) {
          cap += 1;
        }
        if(arrA[ix] || arrB[ix]) {
          cup += 1;
        }
      }
      for(var ix = arrA.length;ix < arrB.length;ix += 1) {
        if(arrB[ix]) {
          cup += 1;
        }
      }
      return arrB.length ? 1 - cap / cup : 0;
    },
    move_window: function(window_size) {
      var cmp = function(arrA, arrB) {
        if(arrA.length != arrB.length) {
          console.warn("array length must be equal", arrA.length, arrB.length);
          return Number.NaN;
        }
        var sumA = that.sum(arrA);
        var sumB = that.sum(arrB);
        if(sumA > sumB) {
          return cmp(arrB, arrA);
        }
        var dist = 0;
        for(var ix = 0;ix < arrA.length;ix += 1) {
          if(!arrA[ix] || arrB[ix]) continue;
          var moved = false;
          for(var move = 1;move <= window_size;move += 1) {
            if(ix - move >= 0 && arrB[ix - move]) {
              moved = true;
              dist += move;
              break;
            }
            if(ix + move < arrB.length && arrB[ix + move]) {
              moved = true;
              dist += move;
              break;
            }
          }
          if(!moved) {
            dist += (window_size + 1) * 2;
          }
        }
        return dist * 1.1 + (sumB - sumA) * 0.9; // punish differences in event counts (assert sumB > sumA)
      };
      return cmp;
    }
  };

  /**
   * Compute the entropy of the given distribution.
   *
   * @param binCounts An array of the distribution of the distinct values.
   *    Every element in the array represents the count of one distinct value.
   *    The order of the elements is not important.
   * @param totalCount (optional) The sum of all bins if already computed.
   * @return The entropy of the distribution in nat
   *    (http://en.wikipedia.org/wiki/Nat_%28information%29).
   */
  this.entropy = function(binCounts, totalCount) {
    var tc;
    if(arguments.length < 2) {
      tc = that.sum(binCounts);
    } else {
      tc = totalCount;
    }
    return -aggregate(binCounts, 0, function(agg, cur) {
      if(cur === 0) {
        return agg;
      }
      var p = cur / tc;
      return agg + p * Math.log(p);
    });
  };

  this.bins = {
    entropy: function(bins) {
      var all = 0;
      var counts = new Uint32Array(bins.getBinCount());
      bins.forEach(function(bin, i) {
        var c = bin.getCount();
        counts[i] = c;
        all += c;
      });
      return that.entropy(counts, all);
    },
    skew: function(bins, mean, stddev) {
      var total = 0;
      var exp3 = 0; // E[ V^3 ]
      bins.forEach(function(b, ix) {
        var v = bins.someValueForIndex(ix);
        var c = b.getCount();
        total += c;
        exp3 += v * v * v * c;
      });
      exp3 /= total;
      // (E[ V^3 ] - 3ms^3 - m^3) / (s^3)
      return (exp3 - 3 * mean * stddev * stddev - mean * mean * mean) / (stddev * stddev * stddev);
    },
    shapePearson: function(bins, traversable) {
      var tCounts = new Uint32Array(bins.getBinCount());
      traversable.forEach(function(v) {
        var ix = bins.indexForValue(v);
        tCounts[ix] += 1;
      });
      var refCounts = new Uint32Array(bins.getBinCount());
      bins.forEach(function(bin, i) {
        var c = bin.getCount();
        refCounts[i] = c;
      });
      return that.metric.pearson(refCounts, tCounts);
    },
    KLD: function(bins, traversable) {
      var tCounts = new Uint32Array(bins.getBinCount());
      traversable.forEach(function(v) {
        var ix = bins.indexForValue(v);
        tCounts[ix] += 1;
      });
      var refCounts = new Uint32Array(bins.getBinCount());
      bins.forEach(function(bin, i) {
        var c = bin.getCount();
        refCounts[i] = c;
      });
      return that.KLD(refCounts, tCounts);
    }
  };

  this.bin = function(array, isNominal, minValue, maxValue, binCount) {
    var min;
    var max;
    if(arguments.length < 4) {
      var minmax = that.minmax(array);
      min = minmax[0];
      max = minmax[1];
    } else {
      min = minValue;
      max = maxValue;
    }
    var k = isNominal ? Math.max(max, 1) : arguments.length < 5 ? Math.ceil(Math.log(length) / Math.LN2 + 1) : binCount;
    var curBins = new Bins(k, isNominal, array.length, min, max);
    if(array.forEach) {
      array.forEach(function(v, i) {
        curBins.addValue(v, i);
      });
    } else {
      for(var ix = 0;ix < array.length;ix += 1) {
        curBins.addValue(array[ix], ix);
      }
    }
    curBins.finish();
    if(isNominal) {
      curBins.sort(function(a, b) {
        return d3.ascending(a.getCount(), b.getCount());
      });
    }

    function Bins(k, isNominal, rowCount, minValue, maxValue) {
      var that = this;
      var arr = [];
      var ord = [];
      var isOrdered = false;
      for(var i = 0; i < k; i += 1) {
        arr.push(new Bin(isNominal, rowCount));
        ord.push(i);
      };
      var maxCount = 0;
      var min = minValue <= maxValue ? minValue : 0;
      var size = minValue < maxValue ? (maxValue - minValue) / k : 1;
      this.getMinValue = function() {
        return minValue;
      };
      this.getMaxValue = function() {
        return maxValue;
      };
      this.getPosForValue = function(v, h) {
        var ix = that.indexForValue(v);
        var ypos = 0;
        var minV = minValue;
        var perH = (maxValue - minValue) / h;
        that.forEach(function(bin, i) {
          if(i >= ix) return;
          var bh = bin.getHeight(h, that.getBinCount());
          ypos += bh;
          minV += bh * perH;
        });
        var oh = that.binForValue(v).getHeight(h, that.getBinCount());
        return ypos + (v - minV) / (oh * perH) * oh;
      };
      this.indexForValue = function(v) {
        return Math.max(Math.min(Math.floor((v - min) / size), k - 1), 0);
      };
      this.binForValue = function(v) {
        var ix = this.indexForValue(v);
        ix === ord[ix] || console.warn("must not call after sort", this, ix, ord[ix]);
        return arr[ix];
      };
      this.addValue = function(v, ix) {
        var bin = this.binForValue(v);
        bin.addIndex(ix);
      };
      this.someValueForIndex = function(ix) {
        return min + size * ix;
      };
      this.finish = function() {
        arr.forEach(function(bin) {
          var c = bin.getCount();
          if(c > maxCount) {
            maxCount = c;
          }
        });
      };
      this.forEach = function(cb) {
        if(!isOrdered) {
          arr.forEach(cb);
        } else {
          arr.forEach(function(bin, ix) {
            cb(bin, ord[ix]);
          });
        }
      };
      this.sort = function(s) {
        ord.sort(function(a, b) {
          return s(arr[a], arr[b]);
        });
        jkjs.util.applyPerm(arr, ord);
        isOrdered = true;
      };
      this.getBinCount = function() {
        return k;
      };
      this.getMaxCount = function() {
        return maxCount;
      };
    } // Bins

    function Bin(isNominal, size) {
      var arr = []; // sorted

      this.addIndex = function(ix) {
        if(arr.length && arr[arr.length - 1] >= ix) console.warn("must be strictly ascending", ix, arr);
        arr.push(ix);
      };
      this.getCount = function() {
        return arr.length;
      };
      this.getIndices = function() {
        return arr;
      };
      this.getWidth = function(w, count, maxCount) {
        if(isNominal) {
          return this.getCount() ? w * count / this.getCount() : 0;
        }
        return maxCount ? w * count / maxCount : 0;
      };
      this.getHeight = function(h, k) {
        if(isNominal) {
          return h * this.getCount() / size;
        }
        return h / k;
      };
    } // Bin

    return curBins;
  };

  this.norm = function(x, mean, sigma) {
    var s = arguments.length > 2 ? sigma : 1;
    var m = arguments.length > 1 ? mean : 0;
    return Math.exp(-(x - m)*(x - m)/(2 * s * s)) / Math.sqrt(2 * Math.PI) / s;
  };
  this.pdf = this.norm;
  this.phi = function(x, mean, sigma) {
    var s = arguments.length > 2 ? sigma : 1;
    var m = arguments.length > 1 ? mean : 0;
    return 0.5 * (1 + that.erf((x - m)/(s * Math.SQRT2)));
  };
  this.erf = function(x) {
    if(x < 0) {
      return -that.erf(-x);
    }
    var a1 = 0.254829592;
    var a2 = -0.284496736;
    var a3 = 1.421413741;
    var a4 = -1.453152027;
    var a5 = 1.061405429;
    var p = 0.3275911;
    var t = 1.0 / (1.0 + p*x);
    return 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x*x);
  };
  this.EMPIRICLY_WEIGHTED_NORM = false;
  /**
   * Computes the area under the Gauss-curve weighted by a linear function.
   *
   *   ∫_{x1}^{x2} (ax + b) / (σ * sqrt(2π)) * e ^ (-(x - μ)^2 / (2 * σ^2)) dx
   *
   * Which can be written as:
   *
   * a * [sqrt(σ / π) * (e ^ T(x1) - e ^ T(x2)) + μ * (Φ(S(x2)) - Φ(S(x1)))] + b * (Φ(x2) - Φ(x1))
   *
   * where T(x) = -(μ - x)^2 / (4 * σ)
   * and   S(x) = sqrt(σ / 2) * x + (1 - sqrt(σ / 2)) * μ
   */
  this.weightedPhi = function(x1, x2, a, b, mean, sigma) {
    var s = arguments.length > 5 ? sigma : 1;
    var m = arguments.length > 4 ? mean : 0;
    var rest = b * (that.phi(x2) - that.phi(x1));
    if(!a) {
      return rest;
    }
    if(that.EMPIRICLY_WEIGHTED_NORM) {
      var step = s * 1e-2;
      var _x1 = Math.max(Math.min(x1, m + s*8), m - s*8);
      var _x2 = Math.max(Math.min(x2, m + s*8), m - s*8);
      var sum = 0;
      for(var x = _x1;x < _x2;x += step) {
        sum += step * that.weightedNorm(x, a, b, m, s);
      }
      return sum;
    }
    var sf = Math.sqrt(s * 0.5);
    var mu_rest = m * (that.phi(sf * x2 + (1 - sf) * m) - that.phi(sf * x1 + (1 - sf) * m));
    var t1 = -(m - x1)*(m - x1) * 0.25 / s;
    var t2 = -(m - x2)*(m - x2) * 0.25 / s;
    var pre = Math.sqrt(s / Math.PI) * (Math.exp(t1) - Math.exp(t2));
    return a * (pre + mu_rest) + rest;
  };
  /**
   * Computes the Gauss-curve weighted by a linear function.
   *
   * (ax + b) / (σ * sqrt(2π)) * e ^ (-(x - μ)^2 / (2 * σ^2))
   */
  this.weightedNorm = function(x, a, b, mean, sigma) {
    var s = arguments.length > 4 ? sigma : 1;
    var m = arguments.length > 3 ? mean : 0;
    return (a*x + b) * that.norm(x, m, s);
  };
  /**
   * Computes the minimum and maximum of the Gauss-curve weighted
   * by a linear function in a given interval.
   *
   * min/max( (ax + b) / (σ * sqrt(2π)) * e ^ (-(x - μ)^2 / (2 * σ^2)) )
   */
  this.weightedNormExtrema = function(x1, x2, a, b, mean, sigma) {
    var s = arguments.length > 5 ? sigma : 1;
    var m = arguments.length > 4 ? mean : 0;
    var arr = [];
    arr.push([ x1, that.weightedNorm(x1, a, b, m, s) ]);
    arr.push([ x2, that.weightedNorm(x2, a, b, m, s) ]);
    if(a !== 0) {
      if(that.EMPIRICLY_WEIGHTED_NORM) {
        var step = s * 1e-2;
        var _x1 = Math.max(Math.min(x1, m + s*8), m - s*8);
        var _x2 = Math.max(Math.min(x2, m + s*8), m - s*8);
        for(var x = _x1;x < _x2;x += step) {
          arr.push([ x, that.weightedNorm(x, a, b, m, s) ]);
        }
      } else {
        var bam = a*m - b;
        var a2 = a*a;
        var b2 = b*b;
        var s2 = s*s;
        var m2 = m*m;
        var root = Math.sqrt(b2 + 2*a*b*m + a2*m2 + 4*a2*s2);
        var x3 = (bam + root) / a * 0.5;
        var x4 = (bam - root) / a * 0.5;
        arr.push([ x3, that.weightedNorm(x3, a, b, m, s) ]);
        arr.push([ x4, that.weightedNorm(x4, a, b, m, s) ]);
      }
    }
    arr.sort(function(a, b) {
      return d3.ascending(a[1], b[1]);
    });
    return [ arr[0], arr[arr.length-1] ];
  };
}; // jkjs.stat

jkjs.stat = new jkjs.stat(); // create instance
