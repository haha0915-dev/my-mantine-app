import MainPage from '@/features/internal/main/MainPage';
import ProtectedPage from '@/widgets/components/ProtectedPage/ProtectedPage';

const InternalHomePage = () => (
	<ProtectedPage>
		<MainPage />
	</ProtectedPage>
);

export default InternalHomePage;
