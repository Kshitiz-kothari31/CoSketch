export class Quadtree {
  constructor(bounds, capacity = 10, maxDepth = 8, depth = 0) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth = depth;
    this.items = [];
    this.divided = false;
  }

  insert(item, itemBounds) {
    if (!this.intersects(this.bounds, itemBounds)) {
      return false; // Does not fit in this node
    }

    // If there's space, or we've hit max depth, just add it here
    if (this.items.length < this.capacity || this.depth >= this.maxDepth) {
      this.items.push({ item, bounds: itemBounds });
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    // Items can overlap multiple quadrants in a region Quadtree
    let inserted = false;
    inserted = this.nw.insert(item, itemBounds) || inserted;
    inserted = this.ne.insert(item, itemBounds) || inserted;
    inserted = this.sw.insert(item, itemBounds) || inserted;
    inserted = this.se.insert(item, itemBounds) || inserted;
    
    return inserted;
  }

  subdivide() {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.nw = new Quadtree({ x, y, width: w, height: h }, this.capacity, this.maxDepth, this.depth + 1);
    this.ne = new Quadtree({ x: x + w, y, width: w, height: h }, this.capacity, this.maxDepth, this.depth + 1);
    this.sw = new Quadtree({ x, y: y + h, width: w, height: h }, this.capacity, this.maxDepth, this.depth + 1);
    this.se = new Quadtree({ x: x + w, y: y + h, width: w, height: h }, this.capacity, this.maxDepth, this.depth + 1);

    this.divided = true;
  }

  queryPoint(point, found = new Set()) {
    // If the point is outside this quad's bounds, ignore it
    if (!this.containsPoint(this.bounds, point)) {
      return found;
    }

    // Check items exactly in this level
    for (const { item, bounds } of this.items) {
      if (this.containsPoint(bounds, point)) {
        found.add(item);
      }
    }

    // Recursively check children
    if (this.divided) {
      this.nw.queryPoint(point, found);
      this.ne.queryPoint(point, found);
      this.sw.queryPoint(point, found);
      this.se.queryPoint(point, found);
    }

    return found;
  }

  queryRange(range, found = new Set()) {
    // If the range is outside this quad's bounds, ignore it
    if (!this.intersects(this.bounds, range)) {
      return found;
    }

    // Check items exactly in this level
    for (const { item, bounds } of this.items) {
      if (this.intersects(bounds, range)) {
        found.add(item);
      }
    }

    // Recursively check children
    if (this.divided) {
      this.nw.queryRange(range, found);
      this.ne.queryRange(range, found);
      this.sw.queryRange(range, found);
      this.se.queryRange(range, found);
    }

    return found;
  }

  intersects(b1, b2) {
    return !(
      b2.x > b1.x + b1.width ||
      b2.x + b2.width < b1.x ||
      b2.y > b1.y + b1.height ||
      b2.y + b2.height < b1.y
    );
  }

  containsPoint(bounds, point) {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }
}
