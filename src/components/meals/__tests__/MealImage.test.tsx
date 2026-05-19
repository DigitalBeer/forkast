import { render, screen, cleanup } from '@testing-library/react';
import { MealImage } from '../MealImage';

// Mock next/image for Vitest
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
  }) => {
    const { src, alt, fill, sizes, className } = props;
    return (
      <div
        data-testid="next-image-mock"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {fill && <div data-testid="fill-indicator">FILL</div>}
        {sizes && <div data-testid="sizes-indicator">{sizes}</div>}
        {className && <div data-testid="classname-indicator">{className}</div>}
      </div>
    );
  },
}));

describe('MealImage', () => {
  afterEach(() => {
    cleanup();
  });

  describe('when src is provided', () => {
    it('renders the Next.js Image component', () => {
      render(
        <MealImage
          src="https://example.com/image.jpg"
          alt="Test meal"
          size="card"
        />,
      );

      const nextImageMock = screen.getByTestId('next-image-mock');
      expect(nextImageMock).toBeInTheDocument();

      const img = nextImageMock.querySelector('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(img).toHaveAttribute('alt', 'Test meal');
    });

    it('passes the sizes prop correctly based on size', () => {
      // Test each size in isolation to avoid DOM pollution
      // Thumbnail size
      render(<MealImage src="test.jpg" alt="Test" size="thumbnail" />);
      expect(screen.getByTestId('sizes-indicator')).toHaveTextContent('200px');
      cleanup();

      // Card size
      render(<MealImage src="test.jpg" alt="Test" size="card" />);
      expect(screen.getByTestId('sizes-indicator')).toHaveTextContent(
        '(max-width: 768px) 50vw, 400px',
      );
      cleanup();

      // Full size
      render(<MealImage src="test.jpg" alt="Test" size="full" />);
      expect(screen.getByTestId('sizes-indicator')).toHaveTextContent(
        '(max-width: 768px) 100vw, 1200px',
      );
    });

    it('applies container classes based on size when image is present', () => {
      // Test thumbnail
      render(<MealImage src="test.jpg" alt="Test" size="thumbnail" />);
      const thumbnailImage = screen.getByTestId('next-image-mock');
      expect(thumbnailImage.parentElement).toHaveClass('h-32');
      expect(thumbnailImage.parentElement).toHaveClass('w-32');
      cleanup();

      // Test card
      render(<MealImage src="test.jpg" alt="Test" size="card" />);
      const cardImage = screen.getByTestId('next-image-mock');
      expect(cardImage.parentElement).toHaveClass('h-40');
      expect(cardImage.parentElement).toHaveClass('w-full');
      cleanup();

      // Test full
      render(<MealImage src="test.jpg" alt="Test" size="full" />);
      const fullImage = screen.getByTestId('next-image-mock');
      expect(fullImage.parentElement).toHaveClass('h-64');
      expect(fullImage.parentElement).toHaveClass('w-full');
    });

    it('merges custom className with container classes when image is present', () => {
      render(
        <MealImage
          src="test.jpg"
          alt="Test"
          size="card"
          className="border-red"
        />,
      );
      const container = screen.getByTestId('next-image-mock').parentElement;
      expect(container).toHaveClass('h-40');
      expect(container).toHaveClass('w-full');
      expect(container).toHaveClass('border-red');
    });
  });

  describe('when src is not provided', () => {
    it('does not render the Next.js Image component', () => {
      render(<MealImage alt="Test meal" size="card" />);
      expect(screen.queryByTestId('next-image-mock')).not.toBeInTheDocument();
    });

    it('renders something as fallback (not the image)', () => {
      render(<MealImage alt="Test meal" size="card" />);
      expect(screen.queryByTestId('next-image-mock')).not.toBeInTheDocument();

      // Should render the MealPlaceholder (look for element with aria-hidden="true")
      const placeholder = document.querySelector('[aria-hidden="true"]');
      expect(placeholder).toBeInTheDocument();
    });

    it('uses custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom</div>;
      render(<MealImage fallback={customFallback} alt="Test" size="card" />);

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('next-image-mock')).not.toBeInTheDocument();
    });

    it('applies correct height to fallback based on size', () => {
      // Test thumbnail fallback height
      render(<MealImage alt="Test meal" size="thumbnail" />);
      // When there's no image, we look for the fallback element directly
      const fallbackElement = document.querySelector('[aria-hidden="true"]');
      expect(fallbackElement).toHaveClass('h-32');
      cleanup();

      // Test card fallback height
      render(<MealImage alt="Test meal" size="card" />);
      const cardFallback = document.querySelector('[aria-hidden="true"]');
      expect(cardFallback).toHaveClass('h-40');
      cleanup();

      // Test full fallback height
      render(<MealImage alt="Test meal" size="full" />);
      const fullFallback = document.querySelector('[aria-hidden="true"]');
      expect(fullFallback).toHaveClass('h-64');
    });

    it('renders MealPlaceholder with correct initials when using alt text', () => {
      render(<MealImage alt="Test Meal" size="card" />);

      // Should not render the image
      expect(screen.queryByTestId('next-image-mock')).not.toBeInTheDocument();

      // Should render MealPlaceholder with initials "TM"
      expect(screen.getByText(/^TM$/)).toBeInTheDocument();
    });
  });
});
