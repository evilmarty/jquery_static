(function($) {
  function elementRect(elem, relative) {
    var position = elem[relative ? 'position' : 'offset'](),
      width = elem.outerWidth(false),
      height = elem.outerHeight(false),
      rect = $.extend(position, {
        width: width,
        height: height,
        right: position.left + width,
        bottom: position.top + height
      });
    return rect;
  }
  
  function viewpointRect() {
    var compat = document.compatMode && document.compatMode != 'BackCompat' && !window.opera,
      viewpoint = compat ? document.documentElement : document.body,
      scrollX = window.scrollX || viewpoint.scrollLeft,
      scrollY = window.scrollY || viewpoint.scrollTop,
      width = viewpoint.clientWidth,
      height = viewpoint.clientHeight,
      rect = {
        top: scrollY,
        left: scrollX,
        width: width,
        right: width + scrollX,
        height: height,
        bottom: height + scrollY
      };
    return rect;
  }
  
  function intersect(r1, r2) {
    return r1.top < r2.bottom && r2.top < r1.bottom && r1.left < r2.right && r2.left < r1.right;
  }
  
  function Static(element, position) {
    this.element = $(element);
    this.position = position;
    
    this.placeholder = $('<div />').hide().insertAfter(this.element);
    this.offsetParent = this.element.offsetParent();
    this.floated = false;
    
    this.update();
  }
  $.extend(Static.prototype, {
    activate: function() {
      if (this.handler) return;
      
      var self = this;
      this.handler = function(e) {
        return self._handler(e);
      }
      $(window).bind('scroll', this.handler);
    },
    deactivate: function() {
      if (!this.handler) return;
      $(window).unbind('scroll', this.handler);
      this.handler = undefined;
    },
    float: function() {
      if (this.floated) return;
      
      var doc = this.element[0].ownerDocument, 
        defaultView = doc.defaultView, 
        computedStyle = defaultView.getComputedStyle(this.element[0], null),
        elemPosition = this.element.position(),
        offsetPosition = this.offsetParent.position(),
        dimensions = {width: this.offsetParent.width(), height: this.offsetParent.height()},
        placeholderStyle = {
          bottom: computedStyle.bottom,
          cssFloat: computedStyle.cssFloat,
          height: this.element.outerHeight(false),
          left: computedStyle.left,
          marginTop: computedStyle.marginTop,
          marginRight: computedStyle.marginRight,
          marginBottom: computedStyle.marginBottom,
          marginLeft: computedStyle.marginLeft,
          position: computedStyle.position,
          right: computedStyle.right,
          top: computedStyle.top,
          visibility: 'hidden',
          width: this.element.outerWidth(false)
        },
        currentStyle = {
          left: this.element.css('left'),
          height: this.element.css('height'),
          position: this.element.css('position'),
          top: this.element.css('top'),
          width: this.element.css('width')
        },
        newStyle = {
          height: this.element.height(),
          position: 'fixed',
          width: this.element.width()
        };
        
      switch (this.position) {
        case 'bottom':
          newStyle.left = elemPosition.left;
          newStyle.top = dimensions.height - newStyle.height;
          break;
        default:
          newStyle.left = elemPosition.left;
          newStyle.top = elemPosition.top;
          break;
      }
      
      this.element.css(newStyle);
      this.placeholder.css(placeholderStyle).show();
      this.previousStyle = currentStyle;
      this.floated = true;
    },
    sink: function() {
      if (!this.floated) return;
      this.element.css(this.previousStyle);
      this.placeholder.hide();
      this.floated = false;
    },
    update: function() {
      var floatable = false,
        viewpoint = viewpointRect(),
        anchor = elementRect(this.element),
        container = elementRect(this.offsetParent),
        offsetParentWidth = this.offsetParent.outerWidth(false),
        offsetParentHeight = this.offsetParent.outerHeight(false),
        relativeContainer = {left: 0, top: 0, width: offsetParentWidth, height: offsetParentHeight, right: offsetParentWidth, height: offsetParentHeight};
      
      if (intersect(container, viewpoint) && intersect(container, anchor)) {
        this.float();
      }
      else {
        this.sink();
      }
    },
    _handler: function() {
      this.update();
    }
  });
  
  $.fn.removeStatic = function() {
    this.each(function() {
      var anchor = $(this).data('static');
      if (anchor !== undefined) {
        anchor.deactivate();
        anchor = null;
        $(this).removeData('static');
      }
    });
    return this;
  }
  $.fn.static = function(position) {
    this.removeStatic().each(function() {
      var anchor = new Static(this, position);
      anchor.activate();
      $(this).data('static', anchor);
    });
    return this;
  }
})(jQuery);