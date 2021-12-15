function attrsFunction(selection, map) {
    return selection.each(function(d, i, ns) {
      var x = map.apply(selection, arguments);
      for (var name in x) ns[i].setAttribute(name, x[name]);
    });
}
  
  function attrsObject(selection, map) {
    for (var name in map) selection.attr(name, map[name]);
    return selection;
  }
  
  export function attrs(selection, map, s) {
    return (typeof map === "function" ? attrsFunction : attrsObject)(selection, map, s);    
  }

  function stylesFunction(selection, map, priority) {
    return selection.each(function(d, i, ns) {
      var x = map.apply(selection, arguments);
      for (var name in x) ns[i].style[name] = x[name];
    });
  }
  
  function stylesObject(selection, map, priority) {
    for (var name in map) selection.style(name, map[name], priority);
    return selection;
  }
  
  export function styles(selection, map, priority) {
    return (typeof map === "function" ? stylesFunction : stylesObject)(selection, map, priority == null ? "" : priority);
  }