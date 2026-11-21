import { describe, expect, it } from "vitest";
import { checkJobUrl, fetchJobText, htmlToText, isPrivateAddress, sniffImage } from "./job-source";

describe("isPrivateAddress", () => {
  it("blocks private, loopback, link-local, metadata and mapped addresses", () => {
    for (const ip of [
      "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254",
      "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1",
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });
  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "172.32.0.1", "142.250.1.1", "2606:4700::1111", "::ffff:8.8.8.8"]) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });
});

describe("checkJobUrl", () => {
  it("rejects anything but public http(s) on standard ports", () => {
    for (const raw of [
      "file:///etc/passwd", "ftp://example.com/job", "not a url", "http://127.0.0.1/", "http://[::1]/",
      "http://169.254.169.254/latest/meta-data", "http://localhost:3000/", "https://user:pw@example.com/",
      "https://example.com:8080/job",
    ]) {
      expect(() => checkJobUrl(raw), raw).toThrow();
    }
    expect(checkJobUrl("https://careers.example.com/jobs/42").hostname).toBe("careers.example.com");
  });

  it("refuses a hostname that resolves to a private address, at connect time", async () => {
    // "localhost.localdomain"-style names are not caught by the name check; the socket's lookup catches them.
    await expect(fetchJobText("http://localtest.me/")).rejects.toThrow(/private network|could not be reached/);
  });
});

describe("sniffImage", () => {
  it("reads the type from the bytes, not the name", () => {
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe("image/png");
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImage(new TextEncoder().encode("RIFF1234WEBPVP8 "))).toBe("image/webp");
    expect(sniffImage(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<svg xmlns"))).toBeNull();
  });
});

describe("htmlToText", () => {
  it("keeps the visible text and drops scripts, styles and navigation", () => {
    const html = `<html><head><style>p{color:red}</style><script>alert(1)</script></head><body>
      <nav>Home | Jobs</nav><h1>Backend Intern</h1><p>Build REST APIs &amp; tests.</p>
      <ul><li>Python</li><li>Docker</li></ul><footer>(c) Example</footer></body></html>`;
    expect(htmlToText(html)).toBe("Backend Intern\nBuild REST APIs & tests.\n- Python\n- Docker");
  });
});
