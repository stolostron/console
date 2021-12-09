  function attrsFunction(selection, map) {
    return selection.each(function() {
      var x = map.apply(selection, arguments);
      for (var name in x) selection.attr(name, x[name]);
    });
}
  
  function attrsObject(selection, map) {
    for (var name in map) selection.attr(name, map[name]);
    return selection;
  }
  
  export function attrs(selection, map) {
    return (typeof map === "function" ? attrsFunction : attrsObject)(selection, map);    
  }

  function stylesFunction(selection, map, priority) {
    return selection.each(function() {
      var x = map.apply(selection, arguments);
      for (var name in x) selection.style(name, x[name], priority);
    });
  }
  
  function stylesObject(selection, map, priority) {
    for (var name in map) selection.style(name, map[name], priority);
    return selection;
  }
  
  export function styles(selection, map, priority) {
    return (typeof map === "function" ? stylesFunction : stylesObject)(selection, map, priority == null ? "" : priority);
  }