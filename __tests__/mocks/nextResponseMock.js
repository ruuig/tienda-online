export class NextResponse {
  static json(body, init = {}) {
    return { body, init };
  }
}

export default { NextResponse };
