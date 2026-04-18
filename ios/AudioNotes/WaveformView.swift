import SwiftUI

/// Scrolling bar-style level meter. Each bar = one recent sample from `levels`.
/// A quiet mic shows tiny bars near the center; a loud voice fills the height.
struct WaveformView: View {
    let levels: [Float]
    var color: Color = .red
    var capacity: Int = 80

    var body: some View {
        GeometryReader { geo in
            let samples = paddedSamples()
            let spacing: CGFloat = 2
            let totalSpacing = spacing * CGFloat(samples.count - 1)
            let barWidth = max(1, (geo.size.width - totalSpacing) / CGFloat(samples.count))
            let midY = geo.size.height / 2

            HStack(alignment: .center, spacing: spacing) {
                ForEach(Array(samples.enumerated()), id: \.offset) { _, lvl in
                    let h = max(2, CGFloat(lvl) * geo.size.height)
                    Capsule()
                        .fill(color.opacity(0.35 + Double(lvl) * 0.65))
                        .frame(width: barWidth, height: h)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
            .overlay(alignment: .center) {
                // Subtle baseline so the graph is readable when silent.
                Rectangle()
                    .fill(color.opacity(0.15))
                    .frame(height: 1)
                    .position(x: geo.size.width / 2, y: midY)
            }
            .animation(.linear(duration: 0.08), value: levels)
        }
    }

    private func paddedSamples() -> [Float] {
        if levels.count >= capacity { return Array(levels.suffix(capacity)) }
        return Array(repeating: 0, count: capacity - levels.count) + levels
    }
}
