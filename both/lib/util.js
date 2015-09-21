
sanitize = function(str) {
  escapeSequences = ['\r', '\n', '\t', '\\', '\f', '\b', '\n', '\'', '\"'];
  res = "";
  for (var i = 0, len = str.length; i < len; i++) {
    if(escapeSequences.indexOf(str[i]) > -1)
      continue;
    if (i === 0 && str[i] === ' ')
      continue;
    if (i !== 0 && str[i] === ' ' && str[i - 1] === ' ')
      continue;
    res += str[i];
  }
  return res;
};
