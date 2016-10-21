function test(string) {
    return string;
};

QUnit.test('test()', function(assert) {
    assert.equal(test("string"), "string", "function outputs string correctly")
});