export function IMAGE_EDITOR_isset( arr, var_args ) {
  for (var i=1, k=arguments.length; i<k; ++i) {
    if (!arr || !arr.hasOwnProperty(arguments[i]) )
      return false
    arr = arr[arguments[i]];
  }
  return true
}

export function IMAGE_EDITOR_list_to_tree(data, options, selected=false) {
  options = options || {};
  var ID_KEY = options.idKey || 'ID';
  var PARENT_KEY = options.parentKey || 'parent_ID';
  var CHILDREN_KEY = options.childrenKey || 'children';

  var tree = [],
      childrenOf = {};
  var item, id, parentId;

  for (var i = 0, length = data.length; i < length; i++) {
      item = data[i];
      id = item[ID_KEY];
      parentId = item[PARENT_KEY] || 0;

      if( item.ID == selected ){
        item.checked = true;
      }else{
        item.checked = false;
      }

      // every item may have children
      childrenOf[id] = childrenOf[id] || [];
      // init its children
      item[CHILDREN_KEY] = childrenOf[id];
      if (parentId != 0) {
          // init its parent's children object
          childrenOf[parentId] = childrenOf[parentId] || [];
          // push it into its parent's children object
          childrenOf[parentId].push(item);
      } else {
          tree.push(item);
      }
  };

  return tree;
}