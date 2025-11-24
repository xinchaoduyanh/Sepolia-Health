import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Pressable } from 'react-native';

interface OTPInputProps {
	value: string[];
	onChange: (value: string[]) => void;
	length?: number;
	disabled?: boolean;
	onResendOTP?: () => void;
}

export default function OtpInput({
	value,
	onChange,
	length = 6,
	disabled = false,
	onResendOTP,
}: OTPInputProps) {
	const inputRef = useRef<TextInput>(null);
	const [countdown, setCountdown] = useState(60);
	const [isResendActive, setIsResendActive] = useState(false);
	const [isFocused, setIsFocused] = useState(false);

	// Countdown timer
	useEffect(() => {
		let timer: ReturnType<typeof setInterval>;
		if (countdown > 0 && !isResendActive) {
			timer = setInterval(() => {
				setCountdown((prev) => prev - 1);
			}, 1000);
		} else if (countdown === 0) {
			setIsResendActive(true);
		}
		return () => {
			if (timer) clearInterval(timer);
		};
	}, [countdown, isResendActive]);

	const handleResendOTP = () => {
		if (isResendActive && onResendOTP) {
			onResendOTP();
			setCountdown(60);
			setIsResendActive(false);
			// Clear OTP and focus input
			onChange(Array(length).fill(''));
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	};

	const handleChangeText = (text: string) => {
		// Only allow numbers
		const numbers = text.replace(/[^0-9]/g, '');

		// Split into array and pad with empty strings
		const digits = numbers.split('').slice(0, length);
		const newValue = [...digits, ...Array(length - digits.length).fill('')];

		onChange(newValue);
	};

	const handlePress = () => {
		inputRef.current?.focus();
	};

	// Get the combined value as a string
	const textValue = value.join('');

	return (
		<View className="w-full">
			<Pressable onPress={handlePress}>
				<View className="mb-8 flex-row justify-between gap-2">
					{Array(length)
						.fill(0)
						.map((_, index) => {
							const isActive = isFocused && index === textValue.length;
							return (
								<View
									key={index}
									className={`h-16 flex-1 items-center justify-center rounded-xl border-2 bg-white shadow-sm ${value[index]
											? 'border-blue-500'
											: isActive
												? 'border-blue-400'
												: 'border-gray-200'
										}`}
								>
									<Text className="text-center text-2xl font-bold text-gray-800">
										{value[index] || ''}
									</Text>
								</View>
							);
						})}
				</View>
			</Pressable>

			{/* Hidden input that captures the actual text */}
			<TextInput
				ref={inputRef}
				value={textValue}
				onChangeText={handleChangeText}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				keyboardType="number-pad"
				maxLength={length}
				style={{
					position: 'absolute',
					opacity: 0,
					height: 1,
					width: 1,
				}}
				autoFocus
			/>

			<TouchableOpacity
				onPress={handleResendOTP}
				disabled={!isResendActive}
				className="mb-4 flex-row items-center justify-center"
			>
				<Text
					className={`text-sm font-semibold ${isResendActive ? 'text-blue-500' : 'text-gray-400'
						}`}
				>
					{isResendActive ? 'Gửi lại mã' : `Gửi lại mã sau ${countdown}s`}
				</Text>
			</TouchableOpacity>
		</View>
	);
}