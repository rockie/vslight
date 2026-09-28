// ocr_text — extract visible text from an image via Vision (offline, no deps).
// Usage: ocr_text <image-path> [min-confidence]
// Prints one recognized line per output line. Exit 1 on usage/io errors.
import Vision
import CoreImage
import Foundation

guard CommandLine.arguments.count >= 2 else {
    FileHandle.standardError.write("usage: ocr_text <image> [min-confidence]\n".data(using: .utf8)!)
    exit(1)
}
let path = CommandLine.arguments[1]
let minConfidence: Float = CommandLine.arguments.count >= 3 ? Float(CommandLine.arguments[2]) ?? 0.5 : 0.5
let url = URL(fileURLWithPath: path)
guard let image = CIImage(contentsOf: url) else {
    FileHandle.standardError.write("cannot read image: \(path)\n".data(using: .utf8)!)
    exit(1)
}
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
let handler = VNImageRequestHandler(ciImage: image)
do {
    try handler.perform([request])
} catch {
    FileHandle.standardError.write("ocr failed: \(error.localizedDescription)\n".data(using: .utf8)!)
    exit(1)
}
for observation in request.results ?? [] {
    guard let candidate = observation.topCandidates(1).first, candidate.confidence >= minConfidence else { continue }
    print(candidate.string)
}
